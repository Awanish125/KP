/**
 * particleShapes.ts
 *
 * Particle position targets for the scroll-morphing backdrop. Shapes are
 * sampled from REAL brand SVG artwork (public/shapes/*.svg) — drop a new
 * SVG there and add one SVG_SHAPES entry to create a new morph target.
 * World units are authored for a camera at z=16 / fov 50
 * (visible ≈ 26.6 w × 14.9 h at z=0).
 *
 * Scroll story (Kiran Publicity):
 *   billboard → skyline → India map → "KIRAN PUBLICITY" → KP logo
 *
 * Color handling: every sampled SVG pixel is classified warm/cool. Warm
 * pixels (the orange/red artwork) raise that particle's accent bit for the
 * shape, and the shader tints them brand-orange only while that shape is
 * on screen — so the KP logo renders with its exact orange/blue split.
 *
 * NOTE: adding a 6th shape also needs a new aP5 attribute in
 * ParticleEntity.tsx's vertex shader — the 5 current slots are
 * position + aP1..aP4.
 */

const rand = Math.random;
/** Cheap gaussian-ish sample centered on 0, ~[-1.2, 1.2]. */
const gauss = () => (rand() + rand() + rand() - 1.5) * 0.8;

export interface ShapeResult {
  pos: Float32Array;
  /** 1 = accent-tinted particle (brand orange) for this shape. */
  accent?: Uint8Array;
}

/** Random point on a flattened shell between rMin..rMax — ambient dust that
 *  carries every form into the corners of the viewport. Depth is squashed
 *  toward the z=0 plane so no dust drifts near the camera and blurs. */
function haloPoint(a: Float32Array, i3: number, rMin: number, rMax: number) {
  let x = gauss(),
    y = gauss(),
    z = gauss();
  const n = Math.hypot(x, y, z) || 1;
  const r = rMin + rand() * (rMax - rMin);
  a[i3] = (x / n) * r;
  a[i3 + 1] = (y / n) * r;
  a[i3 + 2] = (z / n) * r * 0.25;
}

/* ── generic SVG → particle sampling ─────────────────────────────────── */

export interface SvgShapeDef {
  /** Public URL of the SVG (strip full-canvas background rects first). */
  url: string;
  /** Desired world-space width of the artwork's content bounding box. */
  worldW: number;
  /** Vertical offset in world units (default 0 = centered). */
  yOffset?: number;
  /** Height clamp — content is scaled down to fit (default 12.5). */
  maxWorldH?: number;
  /** Fraction of particles sent to the ambient dust halo (default 0.08). */
  haloFrac?: number;
  /** Depth jitter — keep small so shapes stay in one crisp plane. */
  zJitter?: number;
  /** Rasterization width in px — higher = finer sampling (default 900). */
  rasterW?: number;
}

/** Rasterize an SVG file offscreen and return its opaque content pixels as
 *  [x, y, warm] triples. Semi-transparent decoration (like a 30%-opacity
 *  backdrop layer) falls under the alpha threshold and is skipped, so only
 *  the main artwork survives. */
async function svgCandidates(
  url: string,
  rasterW: number,
): Promise<Array<[number, number, number]>> {
  const text = await (await fetch(url)).text();
  // aspect from the viewBox — SVGs exported without width/height attrs
  // report naturalWidth 0, so the viewBox is the reliable source
  const vb = /viewBox\s*=\s*"([^"]+)"/.exec(text);
  const parts = vb ? vb[1].trim().split(/[\s,]+/).map(Number) : null;
  const aspect = parts && parts[2] > 0 ? parts[3] / parts[2] : 1;

  const blobUrl = URL.createObjectURL(
    new Blob([text], { type: "image/svg+xml" }),
  );
  try {
    const img = new Image();
    await new Promise<void>((ok, err) => {
      img.onload = () => ok();
      img.onerror = () => err(new Error(`SVG failed to load: ${url}`));
      img.src = blobUrl;
    });
    const W = rasterW;
    const H = Math.max(1, Math.round(rasterW * aspect));
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const out: Array<[number, number, number]> = [];
    // stride 2 halves memory; placement jitter hides the grid anyway
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const i = (y * W + x) * 4;
        if (d[i + 3] > 140) {
          const warm = d[i] > d[i + 2] + 28 && d[i] > 90 ? 1 : 0;
          out.push([x, y, warm]);
        }
      }
    }
    return out;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/** Turn any SVG into a particle shape: samples the artwork's pixels,
 *  centers its content bounding box, and maps it into world units. */
export async function shapeFromSvg(
  count: number,
  def: SvgShapeDef,
): Promise<ShapeResult> {
  const a = new Float32Array(count * 3);
  const accent = new Uint8Array(count);
  const cands = await svgCandidates(def.url, def.rasterW ?? 900);
  if (!cands.length) {
    for (let i = 0; i < count; i++) haloPoint(a, i * 3, 6, 11);
    return { pos: a, accent };
  }

  // content bbox → world mapping (viewBox padding is irrelevant)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of cands) {
    if (c[0] < minX) minX = c[0];
    if (c[0] > maxX) maxX = c[0];
    if (c[1] < minY) minY = c[1];
    if (c[1] > maxY) maxY = c[1];
  }
  const cw = Math.max(maxX - minX, 1);
  const ch = Math.max(maxY - minY, 1);
  let scale = def.worldW / cw;
  const maxH = def.maxWorldH ?? 12.5;
  if (ch * scale > maxH) scale = maxH / ch;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const haloFrac = def.haloFrac ?? 0.08;
  const zJitter = def.zJitter ?? 0.05;
  const yOff = def.yOffset ?? 0;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (rand() < haloFrac) {
      haloPoint(a, i3, 8.5, 12);
      continue;
    }
    const c = cands[(rand() * cands.length) | 0];
    a[i3] = (c[0] - cx) * scale + (rand() - 0.5) * 0.04;
    a[i3 + 1] = -(c[1] - cy) * scale + yOff + (rand() - 0.5) * 0.04;
    a[i3 + 2] = gauss() * zJitter;
    accent[i] = c[2];
  }
  return { pos: a, accent };
}

/* ── canvas glyph sampling (wordmark only) ───────────────────────────── */

/** Rasterize `draw` on a W×H canvas and return the filled pixel coords. */
function rasterCandidates(
  W: number,
  H: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): Array<[number, number]> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  draw(ctx);
  const img = ctx.getImageData(0, 0, W, H).data;
  const out: Array<[number, number]> = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (img[(y * W + x) * 4 + 3] > 128) out.push([x, y]);
    }
  }
  return out;
}

/** Place a particle on a random candidate pixel, mapped into world units. */
function placeFromRaster(
  a: Float32Array,
  i3: number,
  cands: Array<[number, number]>,
  W: number,
  H: number,
  worldW: number,
  yOffset: number,
  zJitter: number,
) {
  const c = cands[(rand() * cands.length) | 0];
  const worldH = (H / W) * worldW;
  a[i3] = (c[0] / W - 0.5) * worldW + (rand() - 0.5) * 0.04;
  a[i3 + 1] = -(c[1] / H - 0.5) * worldH + yOffset + (rand() - 0.5) * 0.04;
  a[i3 + 2] = gauss() * zJitter;
}

/** WORDMARK — "KIRAN PUBLICITY" in particles.
 *  KIRAN = base (brand blue), PUBLICITY = accent (brand orange). */
export function shapeWordmark(count: number): ShapeResult {
  const a = new Float32Array(count * 3);
  const accent = new Uint8Array(count);
  const W = 1400, H = 460;
  const kiran = rasterCandidates(W, H, (ctx) => {
    ctx.font = "900 190px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KIRAN", W / 2, 128);
  });
  const publicity = rasterCandidates(W, H, (ctx) => {
    ctx.font = "900 148px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PUBLICITY", W / 2, 330);
  });
  const WORLD_W = 16.5;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const pick = rand();
    if (pick < 0.42 && kiran.length) {
      placeFromRaster(a, i3, kiran, W, H, WORLD_W, 0.6, 0.05);
    } else if (pick < 0.9 && publicity.length) {
      placeFromRaster(a, i3, publicity, W, H, WORLD_W, 0.6, 0.05);
      accent[i] = 1;
    } else {
      haloPoint(a, i3, 8.5, 12);
    }
  }
  return { pos: a, accent };
}

/* ── assembly ─────────────────────────────────────────────────────────── */

/** The brand artwork each scroll shape samples. Sizes are the world-space
 *  width of the CONTENT (backgrounds were stripped from these files). */
export const SVG_SHAPES: Record<string, SvgShapeDef> = {
  billboard: { url: "/shapes/billboard.svg", worldW: 12.5 },
  skyline: { url: "/shapes/skyline.svg", worldW: 14.5 },
  india: { url: "/shapes/india-map.svg", worldW: 9.5 },
  // the brand mark — must read exactly like the real logo
  logo: { url: "/shapes/kp-logo.svg", worldW: 10, yOffset: 0.2 },
};

export interface BuiltShapes {
  /** Position targets in scroll order. */
  shapes: Float32Array[];
  /** Per-particle accent bitmask: bit N = accent while shape N shows. */
  accentBits: Float32Array;
}

export async function buildShapes(count: number): Promise<BuiltShapes> {
  const [billboard, skyline, india, logo] = await Promise.all([
    shapeFromSvg(count, SVG_SHAPES.billboard),
    shapeFromSvg(count, SVG_SHAPES.skyline),
    shapeFromSvg(count, SVG_SHAPES.india),
    shapeFromSvg(count, SVG_SHAPES.logo),
  ]);
  const wordmark = shapeWordmark(count);

  const order = [billboard, skyline, india, wordmark, logo];
  const accentBits = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let bits = 0;
    for (let k = 0; k < order.length; k++) {
      if (order[k].accent?.[i]) bits += 1 << k;
    }
    accentBits[i] = bits;
  }

  return { shapes: order.map((s) => s.pos), accentBits };
}
