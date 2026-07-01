import type { ImageData } from './types';

interface RevealSkeletonProps {
  images: ImageData[];
}

/** Pulse-shimmer placeholders shown while images are loading. */
export function RevealSkeleton({ images }: RevealSkeletonProps) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {images.map((img, i) => (
        <div
          key={i}
          className="absolute animate-pulse rounded-xl overflow-hidden"
          style={{
            left:   img.x,
            top:    img.y,
            width:  img.width,
            zIndex: img.zIndex ?? 1,
            rotate: `${img.rotation ?? 0}deg`,
            aspectRatio: '4 / 3',
          }}
        >
          <div className="w-full h-full bg-secondary/8 dark:bg-white/6" />
        </div>
      ))}
    </div>
  );
}
