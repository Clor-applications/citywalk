import { copyFileSync } from "node:fs";

copyFileSync(
  new URL("../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url),
  new URL("../public/maplibre-gl-worker.mjs", import.meta.url),
);
