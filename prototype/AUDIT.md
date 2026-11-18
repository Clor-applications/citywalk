# CityWalk prototype audit (v3 → v6)

Date: 2026-11-15. Scope: `prototype/v3/index.html`, `prototype/v3/data/hsr.json`, `prototype/v3/tools/*.py`.

## Stack

- three.js r160 from jsDelivr (import map). Single HTML file, no build step, no backend, no auth, no database.
- Map data built offline by `tools/build_hsr.py` (OpenStreetMap via Overpass) and `tools/add_heights.py` (Google Open Buildings 2.5D Temporal).
- Served as static files (`python3 -m http.server`).

## What is real data

| Element | Source | Notes |
|---|---|---|
| Road centrelines and names | OpenStreetMap (ODbL) | Real alignments. |
| Road widths | Stylised by highway class | Not surveyed. One-way pairs on 27th Main overlap at OSM widths. |
| Building footprints | OpenStreetMap | 1,330 footprints in an 840 m crop. |
| Building heights | Open Buildings 2.5D 2023 (CC BY 4.0) | 1,003 measured from satellite (about 4 m resolution); 16 from OSM `building:levels`; 311 estimated from footprint area. |
| Named places (160) | OpenStreetMap nodes | Shown as "Unclaimed · not on CityWalk"; no hours, menus or jobs invented. |

## What is procedural placeholder

- All facades, windows, roofs and storefront textures (canvas-generated, original).
- Footpaths: a synthetic band of road width + 3.4 m, not OSM sidewalks.
- Trees (flat-shaded icosahedron blobs, oversized), lamps, vehicles, traffic behaviour.
- Characters: primitive body parts attached to the bones of an animated skeleton.
- No kerbs, crossings, medians, poles, signage or street furniture.

## Third-party assets

| Asset | Origin | Licence status | Action |
|---|---|---|---|
| `Xbot.glb` skeleton + idle/walk/run/agree/headShake clips | three.js examples, Mixamo-derived | Fine for a prototype. Mixamo terms do not allow redistributing raw character files as assets | Replace with our own rig before production |
| `RobotExpressive.glb` (AI guide) | three.js examples, by Tomás Laulhé | CC0 | Removed in v4 |
| Soldier.glb | three.js examples, Mixamo-derived | as above | Removed in v3 |

## Fictional content (must stay labelled)

- 9 demo businesses, 12 demo residents, problem board, quests, ambient walkers.
- **Issue found:** v3 places demo businesses on *real* OSM building footprints near the start, sometimes the same building as a real mapped shop. That can read as a false claim about a real building. v4 places demo tenants only on buildings with no OSM place within 15 m and tags them "demo tenant".

## What genuinely works (verified in Chromium)

- A* pathfinding over a 1 m grid, click to walk, WASD/run, camera collision with building heights.
- Minimap, big map with real road names, List mode, entity panels, quest logic, traffic yielding to the player.
- Residents with profile panels and opt-in wording; ambient walker toggle.
- About 75 fps on a desktop GPU (headless Chromium). **Not tested on mobile.**

## What does not exist yet

- **No AI integration.** The "City Guide" is keyword/category matching over local records. No LLM calls, no retrieval service.
- No real users, accounts, verification, messaging, persistence or server.
- No city overview mode, no onboarding/avatar persistence, no greeting interaction.
- No LOD, chunking or compressed textures (not needed yet at this scale).
- No automated tests.

## Gap to the redesign brief

| Brief item | v3 state | v4 plan |
|---|---|---|
| Production-quality street | Generic blocks | Hero slice: 27th Main, 15th → 18th Cross (~190 m) |
| Kerbs, crossings, median | None | Painted kerbs, zebra crossings, planted median with lamps |
| Varied architecture | 5 textures | Archetypes: painted houses, apartments with balconies, glass offices, shop rows |
| Storefronts and signs | Coloured rectangles | Signs show real OSM names only; demo tenants marked DEMO; unknown shops get blank fascias |
| Trees | Oversized flat blobs | Species: rain tree, jacaranda, gulmohar, pink trumpet, ashoka, coconut |
| Street life objects | Lamps only | Poles + overhead wires, parked two-wheelers, bus shelter, benches, bins, bollards, street signs |
| Lighting | Midday flat | Golden hour, ambient occlusion (GTAO), mild bloom; quality toggle |
| Characters | Primitive bodies | Kept (honest limit); onboarding picker + persistence + greeting |
| AI guide | Yellow robot | Companion orb, clearly labelled AI, no invented data |
| Modes | Walk/Map/List | City overview / Walk / Map / List |

## Premium avatars: decision needed

Procedural primitives cannot reach "premium" quality. Options:

1. Commission a modular adult character set (body types, faces, hair, Indian outfits), rigged and exported as GLB with our own licence.
2. Start from a CC0 modular character pack, re-dress it for Indian outfits, and verify licences per file.
3. Use a third-party avatar-creator SDK. Check the licence, privacy and data-export terms first.

Any of these drops into the existing pipeline (same animation, camera and controls).

---

# v4 delivery: one street (`prototype/v4/index.html`)

Hero slice: 27th Main Road from 15th Cross to 18th Cross (~190 m), real OSM alignment. The rest of the 840 m crop keeps v3-level detail as context.

## What was built (all original, procedural, no third-party art)

| Area | Implementation |
|---|---|
| Street | Raised paver footpaths (2.4 m, 15 cm) cut at junctions; black/yellow painted kerbs; planted median on the divided section with twin-arm lamps; zebra crossings generated at every junction node; manholes |
| Buildings | Archetypes picked from footprint area, real height and road frontage: shop rows (pilasters, shopfronts, fascias, awnings, steps), apartments (balconies with planters and drying clothes), painted houses (door, compound wall, gate, pillars, solar heater), glass offices (curtain wall, entrance canopy). Parapets, floor bands, sunshades (chajjas), window grilles. Party walls get no windows |
| Signs | Real OSM place names (plain type, no logos, Kannada category word where known). Demo tenants show their name + a yellow DEMO chip. Units with no data get blank fascias or shutters |
| Street furniture | Concrete poles with overhead wires and service drops to buildings, benches, bins, tree pits, parked two-wheelers, generic share-bikes at a mapped bicycle_rental node, an illustrative bus shelter, bilingual street-name signs, one signalised junction |
| Trees | Rain tree, neem/honge, gulmohar, jacaranda, pink trumpet, ashoka, coconut palms in compounds. Smooth lumpy canopies, instanced, two LODs |
| Lighting | Golden-hour sun and sky, 4096 shadow map, GTAO ambient occlusion + light bloom (HQ toggle, off by default on narrow screens). Labels drawn after post-processing |
| Modes | City overview (orbit/pan/zoom, click a building to see its real height source, click a business), Walk, Map, List |
| Onboarding | Look picker before walking (7 adult looks), saved in localStorage, reopened from "Look" |
| Interaction | G greets (residents nod back), E enters, Q asks the AI guide |
| AI guide | Companion orb labelled "AI guide · not a person". Still rule-based over local records: no LLM is wired in |
| Honesty fixes | Demo tenants only on buildings with no mapped place inside or within 9 m; one-way traffic keeps direction; "Verified owner · demo" |

## Still placeholder / not done

- **Characters** remain primitive bodies on a Mixamo-derived skeleton. Needs the asset decision above.
- Facade layouts are plausible, not surveyed. Real shop positions along a frontage are approximated from OSM node positions.
- Bus shelter, benches, bins, poles, parked vehicles are illustrative, not mapped objects.
- No LLM, no backend, no accounts. Opportunities, people and events are fictional demo data.
- Measured: ~36 fps with HQ at 1200×943 and ~120 fps (capped) without, both in headless Chromium. **No real mid-range phone test yet.** The camera does not collide with poles or trees.
- Mobile: tap-to-walk works; there is no virtual joystick.

## Extending to other neighbourhoods

Everything is driven by `hsr.json` plus a slice definition (`SLICE`, `HERO_ROAD`). For a new area: run `build_hsr.py` with a new centre, run `add_heights.py`, set the slice. The archetype, street and tree generators need no per-street code. To make the whole map high-detail, chunk the city into ~200 m tiles and build hero detail per tile on demand, keeping the current textured blocks as the far LOD.

Screenshots: `prototype/v4/screenshots/`.

---

# v5 discovery layer (same file, `prototype/v4/index.html`)

Built from the "virtual version of the real world" positioning doc. Pilot focus: jobs and PGs.

| Feature | What it does | Honest limit |
|---|---|---|
| Trust states | Every place shows **Mapped** (OSM, not on CityWalk), **Claimed** (owner verified, nothing confirmed in 7 days) or **Active** (owner confirmed availability within 7 days), plus "confirmed N days ago" | Confirmation dates are demo values |
| PG listings | 4 fictional PGs on hero-street residential buildings with no mapped place nearby: rent per sharing, deposit, notice, food/Wi-Fi/AC/laundry, beds free, distance to companies, Request visit, Ask the owner, 360° tour slot | Bed counts are hidden when a listing is not Active. No real PG data. No 360° tours |
| Onboarding | "Where" (current location with explicit permission, or choose an area) and "What" (Jobs / PGs / People / Everything). Intent swaps the quest set and highlights matching places | Only HSR is built. Location is used once for a distance message and is never stored; you always spawn at a public street point |
| Guide queries | Free text, e.g. "PG under ₹9,000 within 2 km of Lumen Labs with Wi-Fi and food". It parses category, budget, amenities, gender, skill, distance and anchor place, shows "I understood: …", lists matches, or says "No listing matches everything" and shows the closest options with the reason each one fails | Regex parser, no LLM. It cannot invent results by construction |

Not verified: with HQ on, the headless test browser crashed twice on entering Walk mode after onboarding; with HQ off it is stable. HQ worked in v4 testing, so this is likely headless GPU memory, but it needs a check on a real GPU.

Screenshots: `v5-1-onboarding.png`, `v5-2-guide-no-match.png`, `v5-3-pg-listing.png`.

---

# v6: real rigged characters (`prototype/v6/index.html`)

Branch copy of `v4/index.html` (which already contains the v5 discovery layer). Prompt: "should be real 3D gaming characters not like current prototype like dummy."

## What changed

The Xbot skeleton plus procedurally built primitive body parts are gone. Every player, resident and ambient walker is now a rigged, animated GLB character.

| Area | Implementation |
|---|---|
| Character assets | 7 GLBs from Quaternius **Ultimate Modular Men / Women**, CC0 1.0: `male-suit`, `male-hoodie`, `male-casual`, `male-worker`, `female-suit`, `female-casual`, `female-formal`. Stored in `prototype/v6/assets/characters/` (~11 MB total) with `LICENSE-Quaternius.txt` and `README.md` (provenance, source URL, limitations) |
| Looks | 8 onboarding looks mapped onto those 7 models (`senior` reuses `male-suit` with grey hair and a different tint). New `Casual · tee` uses `male-casual`, so no downloaded asset is unused |
| Loading | `GLTFLoader` + a per-model promise cache (`CHAR_CACHE`), preloaded before the loading bar finishes ("Loading 3D characters…"). Residents and walkers `await` the shared promise, so each GLB is fetched once |
| Instancing | `SkeletonUtils.clone()` per person, cloned materials per person, tinted by the authored material names (`Skin`, `Hair*`, `Suit`, `White`, `Tie`, `Black`, `Worker_Vest`, `Worker_Yellow`, `LightBlue`, `Red_Dark`, …) |
| Scale/placement | Model height normalised to `BASE_H = 1.86` m, feet at y = 0, faces +Z; residents 1.86 m, walkers 1.60–1.82 m for variety |
| Animation | `AnimationMixer` per person; 5 of the 24 clips used: `Idle_Neutral`, `Walk`, `Run`, `Wave`, `Interact`. Look-aware `a('idle'\|'walk'\|'run'\|'wave'\|'gesture')`, plus a legacy regex adapter so old quest/greeting calls still work. Idle phase and time-scale randomised per person; walkers' `Walk` timescale follows their speed and stop factor |
| Safety/cleanup | `Pistol` parent mesh hidden on `male-suit`; hard hat (`Worker_Yellow` on `Worker_Head`) hidden for the `noHat` workwear look; invisible hit cylinder kept for hover/click |

## Verified in headless Chrome

- Page loads with no console errors (only the favicon 404); 12 residents and 12 ambient walkers spawn from real GLBs.
- Onboarding picker cycles looks, new `Casual · tee` renders, choice persists to `localStorage` (`cw.look`).
- Walk mode, AI guide query (`PG under ₹9,000 … near Lumen Labs`), List mode and the person panel all still work.
- Suit look confirmed without the pistol mesh.
- Screenshots: `prototype/v6/screenshots/v6-1-onboarding.png` … `v6-6-person.png`.

Not verified: headless Chrome crashes when cycling through all looks quickly (software-GL memory). Needs a check on a real GPU. Mobile not tested.

## Honest character limits

- Stylised low-poly Quaternius art, not photoreal and not Indian-specific. Workwear/formal female looks approximate kurta/saree; labels were renamed honestly (`Workwear · vest`, `Formal · dress`).
- All characters share the same few base faces and body shapes; diversity comes from tint, hair colour and height only. Production needs a commissioned or curated modular set with Indian outfits, body types and faces.
- No LODs, no texture compression, no per-character wardrobe changes mid-session. ~11 MB of character payload (uncached) is acceptable for a prototype, not tuned for mobile.
- Only 5 of 24 animation clips are used; no sitting, phone, eating or traffic-aware gestures.
- Character licence is CC0 for the models; provenance and the derivative tints are recorded in `assets/characters/README.md`.
