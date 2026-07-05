export function countUpValue(target: number, progress: number, start = 0, end = 1) {
  const p = Math.min(Math.max((progress - start) / Math.max(end - start, 0.0001), 0), 1);
  const eased = 1 - Math.pow(1 - p, 3);
  return Math.round(eased * target);
}

export function formatHeroStatValue(value: number, suffix: string) {
  return `${value}${suffix}`;
}
