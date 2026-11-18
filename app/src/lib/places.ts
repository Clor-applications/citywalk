import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { areas, opportunities, places, profiles, requests, users } from "@/db/schema";
import { trustState, type TrustState } from "./trust";

export type PlaceSummary = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  category: string;
  description: string;
  lng: number;
  lat: number;
  verification: string;
  lastConfirmedAt: Date | null;
  isDemo: boolean;
  source: string;
  sourceLicence: string;
  attribution: string;
  distanceM: number;
  openSupply: number;
  trust: TrustState;
};

export async function getArea(areaId: string) {
  const rows = await db.select().from(areas).where(eq(areas.id, areaId)).limit(1);
  return rows[0] ?? null;
}

export async function listPlaces(areaId: string, filters?: { q?: string; kind?: string }) {
  const area = await getArea(areaId);
  if (!area) return [];

  const match = filters?.q
    ? or(ilike(places.name, `%${filters.q}%`), ilike(places.description, `%${filters.q}%`), ilike(places.category, `%${filters.q}%`))
    : undefined;

  const rows = await db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      kind: places.kind,
      category: places.category,
      description: places.description,
      lng: places.lng,
      lat: places.lat,
      verification: places.verification,
      lastConfirmedAt: places.lastConfirmedAt,
      isDemo: places.isDemo,
      source: places.source,
      sourceLicence: places.sourceLicence,
      attribution: places.attribution,
      distanceM: sql<number>`round(ST_Distance(${places.location}::geography, ST_SetSRID(ST_MakePoint(${area.lng}, ${area.lat}), 4326)::geography))::int`,
      openSupply: sql<number>`(select count(*)::int from opportunities o where o.place_id = places.id and o.state = 'published' and (o.expires_at is null or o.expires_at > now()))`,
    })
    .from(places)
    .where(and(eq(places.areaId, areaId), filters?.kind ? eq(places.kind, filters.kind) : undefined, match))
    .orderBy(asc(places.kind), asc(places.name));

  return rows.map((row) => ({
    ...row,
    trust: trustState({
      verification: row.verification,
      lastConfirmedAt: row.lastConfirmedAt,
      openSupply: row.openSupply,
    }),
  })) satisfies PlaceSummary[];
}

export async function getPlace(idOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const [place] = await db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      kind: places.kind,
      category: places.category,
      description: places.description,
      address: places.address,
      lng: places.lng,
      lat: places.lat,
      areaId: places.areaId,
      osmId: places.osmId,
      source: places.source,
      sourceLicence: places.sourceLicence,
      attribution: places.attribution,
      verification: places.verification,
      lastConfirmedAt: places.lastConfirmedAt,
      claimedByUserId: places.claimedByUserId,
      isDemo: places.isDemo,
      metadata: places.metadata,
      createdAt: places.createdAt,
    })
    .from(places)
    .where(isUuid ? eq(places.id, idOrSlug) : eq(places.slug, idOrSlug))
    .limit(1);
  if (!place) return null;

  const open = await db
    .select()
    .from(opportunities)
    .where(
      and(
        eq(opportunities.placeId, place.id),
        eq(opportunities.state, "published"),
        or(sql`${opportunities.expiresAt} is null`, sql`${opportunities.expiresAt} > now()`),
      ),
    )
    .orderBy(desc(opportunities.createdAt));

  return {
    ...place,
    trust: trustState({
      verification: place.verification,
      lastConfirmedAt: place.lastConfirmedAt,
      openSupply: open.length,
    }),
    opportunities: open,
  };
}

export async function getMyOpenRequestsForPlace(placeId: string, userId: string) {
  const rows = await db
    .select({
      id: requests.id,
      kind: requests.kind,
      state: requests.state,
      opportunityId: requests.opportunityId,
      createdAt: requests.createdAt,
    })
    .from(requests)
    .where(and(eq(requests.placeId, placeId), eq(requests.fromUserId, userId), inArray(requests.state, ["sent", "accepted"])));
  return rows;
}

export type PersonSummary = {
  id: string;
  displayName: string;
  headline: string;
  bio: string;
  skills: string[];
  openTo: string;
  isDemo: boolean;
};

export async function listPeople(areaId: string, filters?: { q?: string }) {
  const match = filters?.q
    ? or(
        ilike(profiles.displayName, `%${filters.q}%`),
        ilike(profiles.headline, `%${filters.q}%`),
        sql`array_to_string(${profiles.skills}, ' ') ilike ${`%${filters.q}%`}`,
      )
    : undefined;

  const rows = await db
    .select({
      id: users.id,
      displayName: profiles.displayName,
      headline: profiles.headline,
      bio: profiles.bio,
      skills: profiles.skills,
      openTo: profiles.openTo,
      isDemo: profiles.isDemo,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.areaId, areaId), eq(profiles.discoverable, true), match))
    .orderBy(asc(profiles.displayName))
    .limit(60);

  return rows satisfies PersonSummary[];
}

export async function getPerson(id: string, viewerId?: string) {
  const [row] = await db
    .select({
      id: users.id,
      displayName: profiles.displayName,
      headline: profiles.headline,
      bio: profiles.bio,
      skills: profiles.skills,
      openTo: profiles.openTo,
      isDemo: profiles.isDemo,
      discoverable: profiles.discoverable,
      areaId: profiles.areaId,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.userId, id))
    .limit(1);

  if (!row) return null;
  if (!row.discoverable && row.id !== viewerId) return null;
  return row;
}
