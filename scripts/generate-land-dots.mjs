/**
 * generate-land-dots.mjs — precomputes the dotted-earth point cloud used by
 * the DottedGlobe component.
 *
 * Samples a latitude/longitude grid (longitude step widened by 1/cos(lat)
 * so dot density looks even on the sphere) against world land polygons and
 * writes the hits to src/data/landDots.json as [lat, lng] pairs.
 *
 * Run:  node scripts/generate-land-dots.mjs path/to/countries.geo.json
 * The GeoJSON is only needed at generation time — it is not shipped.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const srcPath = process.argv[2];
if (!srcPath) {
  console.error("Usage: node scripts/generate-land-dots.mjs <countries.geo.json>");
  process.exit(1);
}

const geo = JSON.parse(readFileSync(srcPath, "utf8"));

/** Collect every polygon ring as an array of [lng, lat] points. */
const polygons = [];
for (const feature of geo.features) {
  const g = feature.geometry;
  if (!g) continue;
  if (g.type === "Polygon") {
    polygons.push(g.coordinates);
  } else if (g.type === "MultiPolygon") {
    for (const poly of g.coordinates) polygons.push(poly);
  }
}

/** Ray-casting point-in-ring test. */
function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Inside polygon = inside outer ring, outside every hole. */
function inPolygon(lng, lat, poly) {
  if (!inRing(lng, lat, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) {
    if (inRing(lng, lat, poly[h])) return false;
  }
  return true;
}

// Precompute bounding boxes so most polygon tests exit early.
const bboxes = polygons.map((poly) => {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const [x, y] of poly[0]) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
});

function isLand(lng, lat) {
  for (let i = 0; i < polygons.length; i++) {
    const [minX, minY, maxX, maxY] = bboxes[i];
    if (lng < minX || lng > maxX || lat < minY || lat > maxY) continue;
    if (inPolygon(lng, lat, polygons[i])) return true;
  }
  return false;
}

const LAT_STEP = 1.5;
const LNG_STEP_EQUATOR = 1.5;
const dots = [];

for (let lat = -60; lat <= 78; lat += LAT_STEP) {
  const lngStep = LNG_STEP_EQUATOR / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  for (let lng = -180; lng < 180; lng += lngStep) {
    if (isLand(lng, lat)) {
      dots.push([Math.round(lat * 10) / 10, Math.round(lng * 10) / 10]);
    }
  }
}

const outPath = join(__dirname, "..", "src", "data", "landDots.json");
writeFileSync(outPath, JSON.stringify(dots));
console.log(`Wrote ${dots.length} land dots → ${outPath}`);
