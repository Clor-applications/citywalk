# CityWalk (dev build)

Neighbourhood discovery for HSR Layout, Bengaluru. Places, jobs, PGs and people on one map — with trust labels instead of invented availability, and requests you review before sending.

This is the real application. The 3D street walk at `/walk` is adapted from the prototype in `../prototype`, served as a static three.js scene from `public/walk` — stylised, low-poly, not photoreal. Rendering is a GTA-*style* presentation (AgX tone mapping, GTAO, bloom, cinematic grade with vignette/grain/chromatic aberration, clouds, day/night/rain presets, photoscanned CC0 PBR ground, road and facade textures, a real CC0 HDRI sky environment for day/evening IBL, selectable realistic rigged player avatars, street-level building relief — floor-slab bands, corner pilasters, AC units, shop sign bands and drainpipes on the buildings along the walk, a Bengaluru/HSR-residential plaster palette with rooftop water tanks, solar water heaters and antennas, projecting balconies with clotheslines, and compound walls with gates along residential streets, realistic rigged walkers mixed into the crowd — car clearcoat, headlight beams, wet-road reflections); it is not GTA fidelity, which needs authored high-poly art this project does not ship.

## What works today

- Email OTP sign-in (no passwords), 30-day httpOnly sessions.
- Profile onboarding and settings; discoverability is **off** by default.
- Area explorer with search, kind/trust filters, list and MapLibre map.
- Place pages for companies, PGs, hotels, cafés and cowork/event spaces, with real OSM places marked `Mapped`.
- Requests: intro, job application, PG visit — outbox/inbox, accept/decline/withdraw, one response note.
- Seeded HSR pilot data: 12 labelled demo listings, 16 listings, 7 demo people, 160 real OSM places.
- `/walk` — 27th Main 3D street walk (three.js, third-person, desktop WASD + tap-to-walk on mobile). Real OSM footprints and POI names; the tenants, people and quests are demo content labelled `DEMO`. All scene data and CC0 character models live in `public/walk`.

Not built yet: messaging threads, listing creation, owner claim verification, moderation/reporting, uploads, notifications, data export/deletion, and payments.

## Requirements

- Node 22+, pnpm 10+
- Docker (PostGIS)
- No cloud services needed in dev

## Run it

```bash
# from the repo root
docker compose -f infra/docker-compose.yml up -d

cd app
cp .env.example .env.local          # then set AUTH_SECRET
openssl rand -hex 32                # paste into AUTH_SECRET
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000. Sign in with any email: the dev mail transport prints the code to the server log and shows it in a dev-only banner.

The database is exposed on host port **55432** (5433/5434 are commonly taken). Credentials are `citywalk:citywalk`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next dev server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm typecheck` | Generate route types, then `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply migrations (`tsx src/db/migrate.ts`; prints errors that `drizzle-kit migrate` swallows) |
| `pnpm db:seed` | Reset and reseed demo + OSM data (local DB only) |
| `pnpm db:studio` | Drizzle Studio |

## Architecture

- **Next.js 16 App Router**, React 19, Tailwind 4, TypeScript.
- **PostgreSQL 16 + PostGIS**; Drizzle ORM. Geometry is a `geometry(Point,4326)` column with a GIST index; distance is computed with `ST_Distance(...::geography)`.
- Modular monolith: `src/lib/*` holds auth, requests, trust, places and validation; route handlers under `src/app/api/*`; server components fetch through the lib layer.
- Auth: HMAC-hashed OTP bound to email, 5 attempts, 10-minute expiry; session tokens hashed with SHA-256, cookie `cw_session`.
- Domain rules: trust state is derived (`mapped` → `claimed` → `active`), only `active` needs fresh confirmation **and** open supply. Request transitions enforce sender/recipient roles and unique open requests.
- Map: MapLibre with an OpenFreeMap dark style (no API key). `scripts/sync-maplibre-worker.mjs` copies the matching worker to `public/` on install/dev/build; override the style with `NEXT_PUBLIC_MAP_STYLE_URL`.

## Data honesty rules

- Demo listings are marked `is_demo` and labelled in the UI as fiction; they are never presented as real businesses.
- OpenStreetMap places keep name/geometry and ODbL attribution; nothing about hours, owners or availability is inferred.
- `/walk` road, footpath, ground and facade surfaces use photoscanned PBR textures from [ambientCG](https://ambientcg.com) (CC0); the day/evening sky environment uses an HDRI from [Poly Haven](https://polyhaven.com) (CC0). No attribution required, credited here as good practice.
- `/walk` player avatars include realistic rigged characters from [MMWilliams/char-kit](https://github.com/MMWilliams/char-kit) (MakeHuman bodies, CC0). char-kit's motion-capture clips are third-party with no redistribution licence stated by that repo — confirm the animation licence before any production or redistribution use. See `public/walk/assets/characters/README.md`.
- Availability is hidden unless the owner confirmed it within seven days and has open supply.
- Requests are drafts until the sender confirms; contact details are not exposed.
- The seed refuses non-local databases unless `ALLOW_REMOTE_SEED=1`.

## Deploy notes

`MAIL_TRANSPORT=console` returns the OTP in the API response and is dev-only. Before any deployment set a real transport (`resend` + `RESEND_API_KEY`), a 32+ char `AUTH_SECRET`, TLS, a managed PostGIS database and run migrations as a release step. Add rate limiting at the edge for `/api/auth/*`.
