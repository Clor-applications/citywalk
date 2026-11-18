import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { loginCodes, profiles, sessions, users } from "@/db/schema";
import { generateOtp, hashOtp, hashToken, verifyOtpHash } from "./crypto";
import { normalizeEmail, sendMail } from "./email";
import { AppError } from "./errors";

export const SESSION_COOKIE = "cw_session";
const SESSION_TTL_MS = 30 * 86_400_000;
const CODE_TTL_MS = 10 * 60_000;
const CODE_COOLDOWN_MS = 30_000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters. See .env.example.");
  }
  return secret;
}

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  isDemo: boolean;
};

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isDemo: users.isDemo,
      sessionId: sessions.id,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, isDemo: row.isDemo };
}

export async function getProfile(userId: string) {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function requireUser(nextPath = "/hsr") {
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireProfile(nextPath = "/hsr") {
  const user = await requireUser(nextPath);
  const profile = await getProfile(user.id);
  if (!profile) redirect("/onboard");
  return { user, profile };
}

export async function issueLoginCode(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const secret = authSecret();

  const [recent] = await db
    .select({ createdAt: loginCodes.createdAt })
    .from(loginCodes)
    .where(eq(loginCodes.email, email))
    .orderBy(desc(loginCodes.createdAt))
    .limit(1);
  if (recent && Date.now() - recent.createdAt.getTime() < CODE_COOLDOWN_MS) {
    const retryAfter = Math.ceil((CODE_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
    throw new AppError(429, "cooldown", `Wait ${retryAfter}s before requesting another code.`);
  }

  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(loginCodes)
    .where(and(eq(loginCodes.email, email), gt(loginCodes.createdAt, new Date(Date.now() - 3_600_000))));
  if (recentCount >= MAX_CODES_PER_HOUR) {
    throw new AppError(429, "rate_limited", "Too many codes for this email. Try again in an hour.");
  }

  const code = generateOtp();
  await db.insert(loginCodes).values({
    email,
    codeHash: hashOtp(secret, email, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  await sendMail({
    to: email,
    subject: "Your CityWalk sign-in code",
    text: `Your code is ${code}. It expires in 10 minutes. If you did not ask for this, ignore the email.`,
  });

  const consoleTransport = (process.env.MAIL_TRANSPORT ?? "console") === "console";
  const exposeCode = consoleTransport && process.env.NODE_ENV !== "production";
  return { sent: true as const, devCode: exposeCode ? code : undefined };
}

export async function verifyLoginCode(rawEmail: string, code: string) {
  const email = normalizeEmail(rawEmail);
  const secret = authSecret();

  const [record] = await db
    .select()
    .from(loginCodes)
    .where(and(eq(loginCodes.email, email), gt(loginCodes.expiresAt, new Date())))
    .orderBy(desc(loginCodes.createdAt))
    .limit(1);

  if (!record || record.consumedAt) {
    throw new AppError(400, "invalid_code", "That code is not valid. Request a new one.");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    throw new AppError(429, "too_many_attempts", "Too many attempts. Request a new code.");
  }

  if (!verifyOtpHash(secret, email, code, record.codeHash)) {
    const attempts = record.attempts + 1;
    await db
      .update(loginCodes)
      .set({ attempts, ...(attempts >= MAX_ATTEMPTS ? { consumedAt: new Date() } : {}) })
      .where(eq(loginCodes.id, record.id));
    throw new AppError(400, "invalid_code", "That code is not correct. Check and try again.");
  }

  await db.update(loginCodes).set({ consumedAt: new Date() }).where(eq(loginCodes.id, record.id));

  let user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  if (!user) {
    user = (await db.insert(users).values({ email }).returning())[0];
  }

  await createSession(user.id);
  const profile = await getProfile(user.id);
  return { userId: user.id, hasProfile: Boolean(profile) };
}

async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}
