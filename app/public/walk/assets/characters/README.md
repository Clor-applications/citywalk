# CityWalk character assets

Rigged, animated low-poly characters used in `prototype/v6`.

| File | Source model | Pack |
|---|---|---|
| male-suit.glb | Male / Suit | Quaternius Ultimate Modular Men |
| male-hoodie.glb | Male / Casual_Hoodie | Quaternius Ultimate Modular Men |
| male-casual.glb | Male / Casual_2 | Quaternius Ultimate Modular Men |
| male-worker.glb | Male / Worker | Quaternius Ultimate Modular Men |
| female-suit.glb | Female / Suit | Quaternius Ultimate Modular Women |
| female-casual.glb | Female / Casual | Quaternius Ultimate Modular Women |
| female-formal.glb | Female / Formal | Quaternius Ultimate Modular Women |
| mh_1148.glb | m_young_1148 (realistic) | MMWilliams/char-kit (MakeHuman) |
| mh_3183.glb | f_young_3183 (realistic) | MMWilliams/char-kit (MakeHuman) |

## Realistic avatars (char-kit)

`mh_1148.glb` (male) and `mh_3183.glb` (female) are realistic, textured, rigged
characters from [MMWilliams/char-kit](https://github.com/MMWilliams/char-kit), used as
selectable **player** avatars (the crowd keeps the stylised Quaternius models so the art
direction stays coherent and the scene stays light). Integration notes:

- Shared **22-bone UE5-named rig**, metres, Y-up, characters face **+Z** (same forward
  convention as the Quaternius rig, so no rotation offset is needed).
- Each file carries its own 66 clips (idle, walk, run, jump, strafes, …). Locomotion
  clips are **in-place** (pelvis translation is vertical bob only — verified: walk span
  0.057 m, run 0.094 m, no forward drift).
- Clips animate `pelvis` with an **absolute translation baked to that body's hip height**,
  so a character's clips must only be played on that same character — which is how the app
  loads them (clips come from the same GLB).
- Materials are already optimised to `OPAQUE` (MASK only for iris/hair), so no
  `BLEND`/depth-write fix is required.
- `baseH` in `LOOKS` (1.68 / 1.62) rescales the model to the requested height.

**Licensing caveat:** the MakeHuman bodies are CC0, but char-kit's README states the
**motion capture is third-party and its redistribution licence is not granted by the
repo** — confirm the animation licence before any production/redistribution use.

- Upstream: https://quaternius.com/packs/ultimatemodularcharacters.html and https://quaternius.com/packs/ultimatemodularwomen.html
- Licence: CC0 1.0 Universal (public domain). Original licence text is in `LICENSE-Quaternius.txt`.
- GLB conversion source: https://github.com/LuanDucate/Ducz.CharacterCreator/tree/main/public/models
- Each file contains 24 animation clips (Idle_Neutral, Walk, Run, Wave, Interact, etc.). The app uses Idle_Neutral, Walk, Run and Wave and tints the authored materials per character.
- These are stylised game characters, not photoreal scans. Indian-specific clothing (kurta, saree) and a wider body/skin range need a commissioned or curated modular set before production.
