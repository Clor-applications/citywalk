import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Point column with an explicit SRID so distance queries can cast to geography.
 * Writes accept { lng, lat }; reads must use the `lng` / `lat` columns instead of
 * selecting the geometry itself.
 */
const pointGeometry = customType<{
  data: { lng: number; lat: number };
  driverData: string;
}>({
  dataType() {
    return "geometry(Point,4326)";
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver() {
    throw new Error("Select places.lng / places.lat instead of the geometry column");
  },
});

export const areas = pgTable("areas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    role: text("role").notNull().default("professional"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const loginCodes = pgTable(
  "login_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_codes_email_created_idx").on(t.email, t.createdAt)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    headline: text("headline").notNull(),
    bio: text("bio").notNull().default(""),
    skills: text("skills").array().notNull().default(sql`ARRAY[]::text[]`),
    openTo: text("open_to").notNull().default(""),
    areaId: text("area_id")
      .notNull()
      .references(() => areas.id),
    discoverable: boolean("discoverable").notNull().default(false),
    visibilityScope: text("visibility_scope").notNull().default("area"),
    consentVersion: text("consent_version").notNull().default("2026-11"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("profiles_area_discoverable_idx").on(t.areaId, t.discoverable)],
);

export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    category: text("category").notNull().default("place"),
    description: text("description").notNull().default(""),
    address: text("address"),
    lng: doublePrecision("lng").notNull(),
    lat: doublePrecision("lat").notNull(),
    location: pointGeometry("location").generatedAlwaysAs(
      sql`ST_SetSRID(ST_MakePoint(lng, lat), 4326)`,
    ),
    areaId: text("area_id")
      .notNull()
      .references(() => areas.id),
    osmId: bigint("osm_id", { mode: "number" }),
    source: text("source").notNull().default("citywalk"),
    sourceLicence: text("source_licence").notNull().default(""),
    attribution: text("attribution").notNull().default(""),
    /** mapped | claimed | active — active also needs a recent confirmation and open supply. */
    verification: text("verification").notNull().default("mapped"),
    lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
    claimedByUserId: uuid("claimed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    isDemo: boolean("is_demo").notNull().default(false),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("places_slug_unique").on(t.slug),
    uniqueIndex("places_osm_id_unique").on(t.osmId),
    index("places_area_kind_idx").on(t.areaId, t.kind),
    index("places_location_gist").using("gist", t.location),
  ],
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    /** job | pg | event */
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    payMin: integer("pay_min"),
    payMax: integer("pay_max"),
    payPeriod: text("pay_period"),
    state: text("state").notNull().default("published"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("opportunities_place_state_idx").on(t.placeId, t.state),
    index("opportunities_kind_state_idx").on(t.kind, t.state),
  ],
);

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** intro | application | pg_visit */
    kind: text("kind").notNull(),
    /** sent | accepted | declined | withdrawn */
    state: text("state").notNull().default("sent"),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id").references(() => users.id, { onDelete: "cascade" }),
    placeId: uuid("place_id").references(() => places.id, { onDelete: "set null" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    message: text("message").notNull().default(""),
    responseNote: text("response_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    index("requests_from_idx").on(t.fromUserId, t.createdAt),
    index("requests_to_idx").on(t.toUserId, t.createdAt),
    uniqueIndex("requests_open_pair_unique")
      .on(t.fromUserId, t.toUserId, t.kind)
      .where(sql`state in ('sent', 'accepted') and to_user_id is not null`),
    uniqueIndex("requests_open_opportunity_unique")
      .on(t.fromUserId, t.opportunityId)
      .where(sql`state in ('sent', 'accepted') and opportunity_id is not null`),
  ],
);

export type Area = typeof areas.$inferSelect;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Place = typeof places.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type NewOpportunity = typeof opportunities.$inferInsert;
