import { and, count, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/db";
import { opportunities, places, profiles, requests, users } from "@/db/schema";
import { AppError } from "./errors";
import { canTransition, type RequestKind, type RequestState } from "./trust";

const DAILY_QUOTA = 20;

export type RequestView = {
  id: string;
  kind: RequestKind;
  state: RequestState;
  message: string;
  responseNote: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  place?: { name: string; slug: string; isDemo: boolean };
  opportunity?: { title: string; kind: string; payMin: number | null; payMax: number | null; payPeriod: string | null };
  counterpart?: { id: string; name: string; headline: string; isDemo: boolean };
};

type BaseRow = {
  id: string;
  kind: string;
  state: string;
  message: string;
  responseNote: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  fromUserId: string;
  toUserId: string | null;
  placeId: string | null;
  opportunityId: string | null;
};

async function hydrate(rows: BaseRow[], direction: "outbox" | "inbox"): Promise<RequestView[]> {
  const personIds = [...new Set(rows.map((r) => (direction === "outbox" ? r.toUserId : r.fromUserId)).filter((v): v is string => Boolean(v)))];
  const placeIds = [...new Set(rows.map((r) => r.placeId).filter((v): v is string => Boolean(v)))];
  const opportunityIds = [...new Set(rows.map((r) => r.opportunityId).filter((v): v is string => Boolean(v)))];

  const [people, placeRows, opportunityRows] = await Promise.all([
    personIds.length
      ? db
          .select({ id: users.id, name: profiles.displayName, headline: profiles.headline, isDemo: profiles.isDemo })
          .from(profiles)
          .innerJoin(users, eq(users.id, profiles.userId))
          .where(inArray(profiles.userId, personIds))
      : Promise.resolve([]),
    placeIds.length
      ? db.select({ id: places.id, name: places.name, slug: places.slug, isDemo: places.isDemo }).from(places).where(inArray(places.id, placeIds))
      : Promise.resolve([]),
    opportunityIds.length
      ? db
          .select({
            id: opportunities.id,
            title: opportunities.title,
            kind: opportunities.kind,
            payMin: opportunities.payMin,
            payMax: opportunities.payMax,
            payPeriod: opportunities.payPeriod,
          })
          .from(opportunities)
          .where(inArray(opportunities.id, opportunityIds))
      : Promise.resolve([]),
  ]);

  const peopleById = new Map(people.map((p) => [p.id, p]));
  const placesById = new Map(placeRows.map((p) => [p.id, p]));
  const opportunitiesById = new Map(opportunityRows.map((o) => [o.id, o]));

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as RequestKind,
    state: row.state as RequestState,
    message: row.message,
    responseNote: row.responseNote,
    createdAt: row.createdAt,
    respondedAt: row.respondedAt,
    place: row.placeId ? placesById.get(row.placeId) : undefined,
    opportunity: row.opportunityId ? opportunitiesById.get(row.opportunityId) : undefined,
    counterpart: (() => {
      const id = direction === "outbox" ? row.toUserId : row.fromUserId;
      return id ? peopleById.get(id) : undefined;
    })(),
  }));
}

export async function getOpenRequestToPerson(fromUserId: string, toUserId: string) {
  const [row] = await db
    .select({ id: requests.id, kind: requests.kind, state: requests.state })
    .from(requests)
    .where(
      and(
        eq(requests.fromUserId, fromUserId),
        eq(requests.toUserId, toUserId),
        eq(requests.kind, "intro"),
        inArray(requests.state, ["sent", "accepted"]),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listOutbox(userId: string) {
  const rows = await db.select().from(requests).where(eq(requests.fromUserId, userId)).orderBy(desc(requests.createdAt)).limit(100);
  return hydrate(rows, "outbox");
}

export async function listInbox(userId: string) {
  const rows = await db.select().from(requests).where(eq(requests.toUserId, userId)).orderBy(desc(requests.createdAt)).limit(100);
  return hydrate(rows, "inbox");
}

export async function countInbox(userId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(requests)
    .where(and(eq(requests.toUserId, userId), eq(requests.state, "sent")));
  return value;
}

export async function createRequest(
  userId: string,
  input: { kind: RequestKind; toUserId?: string; opportunityId?: string; message: string },
) {
  const [{ value: recent }] = await db
    .select({ value: count() })
    .from(requests)
    .where(
      and(
        eq(requests.fromUserId, userId),
        gt(requests.createdAt, new Date(Date.now() - 86_400_000)),
        inArray(requests.state, ["sent", "accepted"]),
      ),
    );
  if (recent >= DAILY_QUOTA) {
    throw new AppError(429, "quota", "You have sent a lot of requests today. Try again tomorrow.");
  }

  if (input.kind === "intro") {
    if (!input.toUserId) throw new AppError(400, "invalid", "Choose a person");
    if (input.toUserId === userId) throw new AppError(400, "invalid", "You cannot request an intro to yourself");
    const [target] = await db.select({ discoverable: profiles.discoverable }).from(profiles).where(eq(profiles.userId, input.toUserId)).limit(1);
    if (!target?.discoverable) throw new AppError(404, "not_found", "This person is not discoverable right now");

    const [existing] = await db
      .select({ id: requests.id })
      .from(requests)
      .where(
        and(
          eq(requests.fromUserId, userId),
          eq(requests.toUserId, input.toUserId),
          eq(requests.kind, "intro"),
          inArray(requests.state, ["sent", "accepted"]),
        ),
      )
      .limit(1);
    if (existing) throw new AppError(409, "duplicate", "You already have an open intro request with this person");

    const [row] = await db
      .insert(requests)
      .values({ kind: "intro", fromUserId: userId, toUserId: input.toUserId, message: input.message })
      .returning({ id: requests.id });
    return row;
  }

  if (!input.opportunityId) throw new AppError(400, "invalid", "Choose a listing");
  const [row] = await db
    .select({
      id: opportunities.id,
      kind: opportunities.kind,
      state: opportunities.state,
      placeId: places.id,
      claimedByUserId: places.claimedByUserId,
    })
    .from(opportunities)
    .innerJoin(places, eq(places.id, opportunities.placeId))
    .where(eq(opportunities.id, input.opportunityId))
    .limit(1);

  if (!row) throw new AppError(404, "not_found", "That listing does not exist");
  if (row.state !== "published") throw new AppError(409, "closed", "That listing is no longer open");
  if (row.claimedByUserId === userId) throw new AppError(400, "invalid", "This listing belongs to you");
  if (input.kind === "application" && row.kind !== "job") throw new AppError(400, "invalid", "Applications are for job listings");
  if (input.kind === "pg_visit" && row.kind !== "pg") throw new AppError(400, "invalid", "Visit requests are for PG listings");

  const [existing] = await db
    .select({ id: requests.id })
    .from(requests)
    .where(
      and(
        eq(requests.fromUserId, userId),
        eq(requests.opportunityId, input.opportunityId),
        inArray(requests.state, ["sent", "accepted"]),
      ),
    )
    .limit(1);
  if (existing) throw new AppError(409, "duplicate", "You already have an open request for this listing");

  const [created] = await db
    .insert(requests)
    .values({
      kind: input.kind,
      fromUserId: userId,
      toUserId: row.claimedByUserId,
      placeId: row.placeId,
      opportunityId: input.opportunityId,
      message: input.message,
    })
    .returning({ id: requests.id });
  return created;
}

export async function transitionRequest(
  requestId: string,
  actorId: string,
  action: "accept" | "decline" | "withdraw",
  note?: string,
) {
  const [row] = await db
    .select({
      id: requests.id,
      state: requests.state,
      kind: requests.kind,
      fromUserId: requests.fromUserId,
      toUserId: requests.toUserId,
    })
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!row) throw new AppError(404, "not_found", "Request not found");

  const allowed = canTransition({ ...row, actorId, action });
  if (!allowed) {
    if (row.state !== "sent") throw new AppError(409, "closed", "This request is already closed");
    throw new AppError(403, "forbidden", "You cannot change this request");
  }

  const nextState = action === "accept" ? "accepted" : action === "decline" ? "declined" : "withdrawn";
  const [updated] = await db
    .update(requests)
    .set({
      state: nextState,
      updatedAt: new Date(),
      ...(action === "withdraw" ? {} : { respondedAt: new Date(), responseNote: note ?? null }),
    })
    .where(and(eq(requests.id, requestId), eq(requests.state, "sent")))
    .returning({ id: requests.id, state: requests.state });

  if (!updated) throw new AppError(409, "conflict", "This request changed while you were looking at it");
  return updated;
}
