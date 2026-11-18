import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(secret: string, email: string, code: string) {
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}

export function verifyOtpHash(secret: string, email: string, code: string, expected: string) {
  const actual = Buffer.from(hashOtp(secret, email, code));
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
