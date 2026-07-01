/**
 * Returns the GSAP starting-transform offset (in px) for an image's entrance
 * animation, based on where the image will finally rest inside the section.
 *
 * Images near the left edge fly in from the left, near the top from above, etc.
 * Corner images come in diagonally. Centre images come from the nearest axis.
 */
export function generateStartPosition(
  xCss: string,
  yCss: string,
  vw: number,
  vh: number,
): { x: number; y: number } {
  // Parse percentage or px. For percentages we use the percentage value (0–100).
  const xPct = xCss.endsWith('%')
    ? parseFloat(xCss)
    : (parseFloat(xCss) / vw) * 100;
  const yPct = yCss.endsWith('%')
    ? parseFloat(yCss)
    : (parseFloat(yCss) / vh) * 100;

  const nearLeft   = xPct < 35;
  const nearRight  = xPct > 65;
  const nearTop    = yPct < 30;
  const nearBottom = yPct > 72;

  const ox = nearLeft  ? -vw * 0.7 : nearRight  ? vw * 0.7  : 0;
  const oy = nearTop   ? -vh * 0.6 : nearBottom ? vh * 0.6  : 0;

  // Pure-horizontal entries get a tiny vertical nudge for organicism (index-seeded).
  if (ox !== 0 && oy === 0) return { x: ox, y: vh * 0.06 * Math.sign(ox) };
  if (oy !== 0 && ox === 0) return { x: vw * 0.04 * Math.sign(oy), y: oy };

  // Centre images come straight up from below (cinematic default).
  if (ox === 0 && oy === 0) return { x: 0, y: vh * 0.55 };

  return { x: ox, y: oy };
}

/**
 * Generates a starting rotation offset that exaggerates the image's
 * final rotation, so the entrance feels like a "settle into place".
 */
export function generateStartRotation(finalRot: number, index: number): number {
  const sign = index % 2 === 0 ? 1 : -1;
  return finalRot + sign * (18 + (index % 4) * 6);
}
