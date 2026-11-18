import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import pois from "./seed-data/hsr-pois.json";
import { db, client } from "./index";
import { areas, opportunities, places, profiles, users } from "./schema";

loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
if (!/localhost|127\.0\.0\.1/.test(url) && !process.env.ALLOW_REMOTE_SEED) {
  throw new Error("Refusing to seed a non-local database. Set ALLOW_REMOTE_SEED=1 to override.");
}

const CENTER = { lat: 12.911333400909092, lng: 77.65141367545455 };
const AREA_ID = "hsr";
const M_PER_DEG_LAT = 111_320;
const mPerDegLng = 111_320 * Math.cos((CENTER.lat * Math.PI) / 180);

const at = (east: number, south: number) => ({
  lng: Number((CENTER.lng + east / mPerDegLng).toFixed(7)),
  lat: Number((CENTER.lat - south / M_PER_DEG_LAT).toFixed(7)),
});

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

type DemoPlace = {
  slug: string;
  name: string;
  kind: "company" | "pg" | "hotel" | "cafe" | "cowork";
  category: string;
  description: string;
  east: number;
  south: number;
  verification: "claimed" | "active";
  confirmedDaysAgo: number;
  metadata?: Record<string, unknown>;
};

const DEMO_PLACES: DemoPlace[] = [
  {
    slug: "lumen-labs",
    name: "Lumen Labs",
    kind: "company",
    category: "Product studio",
    description: "A 30-person product studio building dashboards for logistics teams. Demo tenant, not a real company.",
    east: 0,
    south: 0,
    verification: "active",
    confirmedDaysAgo: 2,
  },
  {
    slug: "kite-robotics",
    name: "Kite Robotics",
    kind: "company",
    category: "Robotics",
    description: "Warehouse robots assembled and tested in HSR. Demo tenant, not a real company.",
    east: 90,
    south: -40,
    verification: "active",
    confirmedDaysAgo: 4,
  },
  {
    slug: "ledgerly-fintech",
    name: "Ledgerly Fintech",
    kind: "company",
    category: "Fintech",
    description: "Payments reconciliation tooling. Demo tenant with stale availability on purpose.",
    east: -70,
    south: 55,
    verification: "claimed",
    confirmedDaysAgo: 12,
  },
  {
    slug: "pixel-kitchen-studio",
    name: "Pixel Kitchen Studio",
    kind: "company",
    category: "Design studio",
    description: "Brand and motion design for food businesses. Demo tenant, not a real company.",
    east: 35,
    south: 80,
    verification: "active",
    confirmedDaysAgo: 6,
  },
  {
    slug: "nest-comfort-pg",
    name: "Nest Comfort PG",
    kind: "pg",
    category: "Paying guest",
    description: "Furnished rooms a short walk from 27th Main. Demo listing with fictional availability.",
    east: 25,
    south: -25,
    verification: "active",
    confirmedDaysAgo: 1,
    metadata: { gender: "any", noticeDays: 30, deposit: 25000 },
  },
  {
    slug: "sunrise-co-living",
    name: "Sunrise Co-living",
    kind: "pg",
    category: "Co-living",
    description: "Co-living floor with shared kitchen and a rooftop. Demo listing with fictional availability.",
    east: 60,
    south: 30,
    verification: "active",
    confirmedDaysAgo: 5,
    metadata: { gender: "any", noticeDays: 30, deposit: 20000 },
  },
  {
    slug: "green-leaf-stay",
    name: "Green Leaf Stay",
    kind: "pg",
    category: "Paying guest",
    description: "Quiet PG off 17th Cross. Demo listing marked stale to show unconfirmed availability.",
    east: -40,
    south: -60,
    verification: "claimed",
    confirmedDaysAgo: 10,
    metadata: { gender: "any", noticeDays: 15, deposit: 18000 },
  },
  {
    slug: "maple-homes-pg",
    name: "Maple Homes PG",
    kind: "pg",
    category: "Paying guest",
    description: "Single and double rooms near the 27th Main shops. Demo listing.",
    east: -90,
    south: 10,
    verification: "active",
    confirmedDaysAgo: 3,
    metadata: { gender: "women", noticeDays: 30, deposit: 30000 },
  },
  {
    slug: "courtyard-stay-inn",
    name: "Courtyard Stay Inn",
    kind: "hotel",
    category: "Hotel",
    description: "Small hotel with 14 rooms. Demo listing, not a real hotel.",
    east: 10,
    south: 45,
    verification: "active",
    confirmedDaysAgo: 2,
    metadata: {
      rooms: [
        { name: "Standard double", price: 3200, left: 3 },
        { name: "Deluxe", price: 4600, left: 1 },
      ],
    },
  },
  {
    slug: "masala-lane-kitchen",
    name: "Masala Lane Kitchen",
    kind: "cafe",
    category: "Restaurant",
    description: "South Indian breakfast and meals. Demo listing with a stale confirmation.",
    east: -15,
    south: -18,
    verification: "claimed",
    confirmedDaysAgo: 14,
    metadata: {
      hours: "07:00–22:00",
      menu: [
        { item: "Masala dosa", price: 90 },
        { item: "Filter coffee", price: 40 },
      ],
    },
  },
  {
    slug: "deskline-cowork",
    name: "Deskline Cowork",
    kind: "cowork",
    category: "Coworking",
    description: "Day passes and two meeting rooms. Demo listing.",
    east: 70,
    south: -80,
    verification: "active",
    confirmedDaysAgo: 2,
    metadata: { dayPass: 450 },
  },
  {
    slug: "hive-hall",
    name: "Hive Hall",
    kind: "cowork",
    category: "Events space",
    description: "Event hall used by neighbourhood meetups. Demo listing.",
    east: -30,
    south: 95,
    verification: "active",
    confirmedDaysAgo: 3,
    metadata: { capacity: 80 },
  },
];

type DemoOpportunity = {
  placeSlug: string;
  kind: "job" | "pg" | "event";
  title: string;
  description: string;
  payMin?: number;
  payMax?: number;
  payPeriod?: string;
  metadata?: Record<string, unknown>;
};

const DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  {
    placeSlug: "lumen-labs",
    kind: "job",
    title: "Frontend Engineer",
    description: "React, TypeScript and design systems. Hybrid from the HSR office.",
    payMin: 120_000,
    payMax: 180_000,
    payPeriod: "month",
  },
  {
    placeSlug: "lumen-labs",
    kind: "job",
    title: "Product Designer",
    description: "Own flows for a logistics dashboard. Portfolio-first process.",
    payMin: 100_000,
    payMax: 160_000,
    payPeriod: "month",
  },
  {
    placeSlug: "kite-robotics",
    kind: "job",
    title: "Embedded Systems Engineer",
    description: "C++ on ARM, motor control and sensor bring-up.",
    payMin: 90_000,
    payMax: 150_000,
    payPeriod: "month",
  },
  {
    placeSlug: "kite-robotics",
    kind: "job",
    title: "Robotics Intern",
    description: "Six-month internship on the fleet test bench.",
    payMin: 25_000,
    payMax: 30_000,
    payPeriod: "month",
  },
  {
    placeSlug: "ledgerly-fintech",
    kind: "job",
    title: "Backend Engineer",
    description: "Postgres and event pipelines for reconciliation.",
    payMin: 110_000,
    payMax: 170_000,
    payPeriod: "month",
  },
  {
    placeSlug: "pixel-kitchen-studio",
    kind: "job",
    title: "Brand Designer",
    description: "Identity and packaging for food brands.",
    payMin: 80_000,
    payMax: 130_000,
    payPeriod: "month",
  },
  {
    placeSlug: "nest-comfort-pg",
    kind: "pg",
    title: "Double sharing",
    description: "Two beds per room, attached bath, meals included.",
    payMin: 8_500,
    payMax: 8_500,
    payPeriod: "month",
    metadata: { sharing: "Double", rent: 8_500, deposit: 25_000, bedsFree: 3, amenities: ["Food", "Wi-Fi", "Laundry", "Power backup"] },
  },
  {
    placeSlug: "nest-comfort-pg",
    kind: "pg",
    title: "Single room",
    description: "Private room with desk and wardrobe.",
    payMin: 12_500,
    payMax: 12_500,
    payPeriod: "month",
    metadata: { sharing: "Single", rent: 12_500, deposit: 25_000, bedsFree: 1, amenities: ["Food", "Wi-Fi", "AC", "Power backup"] },
  },
  {
    placeSlug: "sunrise-co-living",
    kind: "pg",
    title: "Double sharing",
    description: "Co-living floor with shared kitchen and rooftop.",
    payMin: 9_000,
    payMax: 9_000,
    payPeriod: "month",
    metadata: { sharing: "Double", rent: 9_000, deposit: 20_000, bedsFree: 2, amenities: ["Food", "Wi-Fi", "Housekeeping"] },
  },
  {
    placeSlug: "sunrise-co-living",
    kind: "pg",
    title: "Triple sharing",
    description: "Budget bed with shared bath.",
    payMin: 7_000,
    payMax: 7_000,
    payPeriod: "month",
    metadata: { sharing: "Triple", rent: 7_000, deposit: 20_000, bedsFree: 4, amenities: ["Food", "Wi-Fi"] },
  },
  {
    placeSlug: "green-leaf-stay",
    kind: "pg",
    title: "Double sharing",
    description: "Availability not confirmed in the last 7 days.",
    payMin: 7_800,
    payMax: 7_800,
    payPeriod: "month",
    metadata: { sharing: "Double", rent: 7_800, deposit: 18_000, bedsFree: null, amenities: ["Food", "Wi-Fi", "Laundry"] },
  },
  {
    placeSlug: "maple-homes-pg",
    kind: "pg",
    title: "Single room",
    description: "Women-only floor, private room.",
    payMin: 13_500,
    payMax: 13_500,
    payPeriod: "month",
    metadata: { sharing: "Single", rent: 13_500, deposit: 30_000, bedsFree: 2, amenities: ["Food", "Wi-Fi", "AC", "Housekeeping"] },
  },
  {
    placeSlug: "maple-homes-pg",
    kind: "pg",
    title: "Double sharing",
    description: "Women-only floor, two beds per room.",
    payMin: 9_800,
    payMax: 9_800,
    payPeriod: "month",
    metadata: { sharing: "Double", rent: 9_800, deposit: 30_000, bedsFree: 3, amenities: ["Food", "Wi-Fi", "Laundry"] },
  },
  {
    placeSlug: "deskline-cowork",
    kind: "event",
    title: "Friday Founders Coffee",
    description: "Open table for founders and operators. 12 seats.",
    metadata: { time: "Fri 17:00", going: 12 },
  },
  {
    placeSlug: "deskline-cowork",
    kind: "event",
    title: "React Study Group",
    description: "Bring a component, leave with review notes.",
    metadata: { time: "Sat 10:30", going: 24 },
  },
  {
    placeSlug: "hive-hall",
    kind: "event",
    title: "Design Systems Meetup",
    description: "Three short talks and a critique table.",
    metadata: { time: "Thu 18:30", going: 56 },
  },
];

type DemoPerson = {
  email: string;
  displayName: string;
  headline: string;
  bio: string;
  skills: string[];
  openTo: string;
};

const DEMO_PEOPLE: DemoPerson[] = [
  {
    email: "demo.ananya@example.invalid",
    displayName: "Ananya Rao",
    headline: "Frontend engineer at Lumen Labs",
    bio: "Builds dashboards and design systems. Happy to review portfolios. Demo profile.",
    skills: ["React", "TypeScript", "Design systems"],
    openTo: "Mentoring juniors · 30 min chats",
  },
  {
    email: "demo.karthik@example.invalid",
    displayName: "Karthik Gowda",
    headline: "Founder, Kite Robotics",
    bio: "Warehouse robots made in HSR. Demo profile.",
    skills: ["Robotics", "Hiring", "Hardware"],
    openTo: "Hiring 2 embedded engineers",
  },
  {
    email: "demo.lakshmi@example.invalid",
    displayName: "Lakshmi Iyer",
    headline: "Head chef, Masala Lane Kitchen",
    bio: "Twenty years of dosas and counting. Demo profile.",
    skills: ["South Indian", "Kitchen ops"],
    openTo: "Hiring line cooks",
  },
  {
    email: "demo.meera@example.invalid",
    displayName: "Meera Pillai",
    headline: "Front office, Courtyard Stay Inn",
    bio: "Knows every bus route out of HSR. Demo profile.",
    skills: ["Hospitality", "Kannada", "Malayalam"],
    openTo: "Answering stay questions",
  },
  {
    email: "demo.rohit@example.invalid",
    displayName: "Rohit Menon",
    headline: "Backend engineer at Ledgerly Fintech",
    bio: "Postgres, queues and reconciliation. Demo profile.",
    skills: ["Postgres", "Go", "Event pipelines"],
    openTo: "Pairing on query performance",
  },
  {
    email: "demo.ravi@example.invalid",
    displayName: "Ravi Shankar",
    headline: "PG manager, Nest Comfort",
    bio: "Looks after two PGs in HSR and answers visit requests. Demo profile.",
    skills: ["PG operations", "Kannada", "Hindi"],
    openTo: "Showing rooms this week",
  },
  {
    email: "demo.sneha@example.invalid",
    displayName: "Sneha Kulkarni",
    headline: "Brand designer at Pixel Kitchen Studio",
    bio: "Identity and packaging for food brands. Demo profile.",
    skills: ["Branding", "Packaging", "Figma"],
    openTo: "Freelance collaborations",
  },
];

async function main() {
  console.log("seeding", url!.replace(/:[^:@]+@/, ":****@"));

  await db
    .insert(areas)
    .values({ id: AREA_ID, name: "HSR Layout", city: "Bengaluru", lat: CENTER.lat, lng: CENTER.lng })
    .onConflictDoUpdate({
      target: areas.id,
      set: { name: "HSR Layout", city: "Bengaluru", lat: CENTER.lat, lng: CENTER.lng },
    });

  await db.delete(places).where(eq(places.isDemo, true));
  const demoUserEmails = DEMO_PEOPLE.map((p) => p.email);
  for (const email of demoUserEmails) await db.delete(users).where(eq(users.email, email));

  const demoPlaces = await db
    .insert(places)
    .values(
      DEMO_PLACES.map((p) => {
        const { lng, lat } = at(p.east, p.south);
        return {
          slug: p.slug,
          name: p.name,
          kind: p.kind,
          category: p.category,
          description: p.description,
          lng,
          lat,
          areaId: AREA_ID,
          source: "citywalk-demo",
          sourceLicence: "",
          attribution: "Fictional demo listing · not a real business",
          verification: p.verification,
          lastConfirmedAt: daysAgo(p.confirmedDaysAgo),
          isDemo: true,
          metadata: p.metadata ?? {},
        };
      }),
    )
    .returning({ id: places.id, slug: places.slug });

  const placeBySlug = new Map(demoPlaces.map((p) => [p.slug, p.id]));

  await db.insert(opportunities).values(
    DEMO_OPPORTUNITIES.map((o) => ({
      placeId: placeBySlug.get(o.placeSlug)!,
      kind: o.kind,
      title: o.title,
      description: o.description,
      payMin: o.payMin ?? null,
      payMax: o.payMax ?? null,
      payPeriod: o.payPeriod ?? null,
      state: "published",
      isDemo: true,
      metadata: o.metadata ?? {},
    })),
  );

  const demoUsers = await db
    .insert(users)
    .values(DEMO_PEOPLE.map((p) => ({ email: p.email, role: "professional", isDemo: true })))
    .returning({ id: users.id, email: users.email });

  const userByEmail = new Map(demoUsers.map((u) => [u.email, u.id]));

  await db.insert(profiles).values(
    DEMO_PEOPLE.map((p) => ({
      userId: userByEmail.get(p.email)!,
      displayName: p.displayName,
      headline: p.headline,
      bio: p.bio,
      skills: p.skills,
      openTo: p.openTo,
      areaId: AREA_ID,
      discoverable: true,
      visibilityScope: "area",
      isDemo: true,
    })),
  );

  // Route listing requests to a plausible demo contact instead of a dead queue.
  const DEMO_CONTACT_BY_PLACE: Record<string, string> = {
    "lumen-labs": "demo.ananya@example.invalid",
    "kite-robotics": "demo.karthik@example.invalid",
    "ledgerly-fintech": "demo.rohit@example.invalid",
    "pixel-kitchen-studio": "demo.sneha@example.invalid",
    "masala-lane-kitchen": "demo.lakshmi@example.invalid",
    "courtyard-stay-inn": "demo.meera@example.invalid",
    "nest-comfort-pg": "demo.ravi@example.invalid",
    "sunrise-co-living": "demo.ravi@example.invalid",
  };
  for (const [slug, email] of Object.entries(DEMO_CONTACT_BY_PLACE)) {
    await db
      .update(places)
      .set({ claimedByUserId: userByEmail.get(email)! })
      .where(eq(places.slug, slug));
  }

  const osmRows = pois.pois.map((p) => ({
    slug: `osm-${p.osmId}`,
    name: p.name,
    kind: "osm",
    category: p.category,
    description: "",
    lng: p.lng,
    lat: p.lat,
    areaId: AREA_ID,
    osmId: p.osmId,
    source: "openstreetmap",
    sourceLicence: "ODbL-1.0",
    attribution: "© OpenStreetMap contributors",
    verification: "mapped",
    isDemo: false,
    metadata: {},
  }));

  await db
    .insert(places)
    .values(osmRows)
    .onConflictDoUpdate({
      target: places.osmId,
      set: { name: places.name, category: places.category, lng: places.lng, lat: places.lat },
    });

  console.log(
    `seeded ${DEMO_PLACES.length} demo places, ${DEMO_OPPORTUNITIES.length} opportunities, ${DEMO_PEOPLE.length} demo people and ${osmRows.length} OSM places`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
