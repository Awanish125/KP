"use client";

interface GalleryCounterProps {
  index: number;
  total: number;
}

export function GalleryCounter({ index, total }: GalleryCounterProps) {
  return (
    <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-md">
      <span className="tabular-nums">{index + 1}</span>
      <span className="mx-1 text-white/40">/</span>
      <span className="tabular-nums text-white/60">{total}</span>
    </div>
  );
}
