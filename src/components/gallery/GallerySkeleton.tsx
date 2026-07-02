const HEIGHTS = ["aspect-square", "aspect-[4/5.5] row-span-2", "aspect-[4/5]", "aspect-[3/4.5] row-span-2"];

export function GallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-3xl bg-black/5 dark:bg-white/5 ${HEIGHTS[i % HEIGHTS.length]}`}
        />
      ))}
    </div>
  );
}
