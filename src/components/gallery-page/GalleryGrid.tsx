"use client";

import { useEffect, useMemo, useState } from "react";
import { GalleryCard } from "./GalleryCard";
import type { GalleryImage, GalleryCardVariant } from "./types/gallery";

/**
 * JS-distributed flexbox masonry (not CSS `columns-*`). CSS multi-column
 * layout rebalances column heights whenever any card's internal content
 * changes size — proven to cause a transient overlap bug on hover-driven
 * content changes in this project. Plain flexbox columns don't rebalance.
 */
function useResponsiveColumns(maxColumns: number) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const mdQuery = window.matchMedia("(min-width: 768px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");
    const xlQuery = window.matchMedia("(min-width: 1400px)");

    const update = () => {
      if (xlQuery.matches && maxColumns >= 4) setColumns(4);
      else if (lgQuery.matches && maxColumns >= 3) setColumns(Math.min(3, maxColumns));
      else if (mdQuery.matches && maxColumns >= 2) setColumns(Math.min(2, maxColumns));
      else setColumns(1);
    };

    update();
    [mdQuery, lgQuery, xlQuery].forEach((q) => q.addEventListener("change", update));
    return () => [mdQuery, lgQuery, xlQuery].forEach((q) => q.removeEventListener("change", update));
  }, [maxColumns]);

  return columns;
}

const ASPECTS = ["aspect-[4/5]", "aspect-square", "aspect-[4/5.5]", "aspect-[3/4.5]", "aspect-[16/11]"];

interface GalleryGridProps {
  images: GalleryImage[];
  columns?: number;
  gap?: string;
  variant?: GalleryCardVariant;
  onOpen: (index: number) => void;
  cardProps?: Record<string, unknown>;
}

export function GalleryGrid({ images, columns = 4, gap = "1.1rem", variant, onOpen, cardProps }: GalleryGridProps) {
  const activeColumns = useResponsiveColumns(columns);

  const buckets = useMemo(() => {
    const cols: { image: GalleryImage; index: number }[][] = Array.from({ length: activeColumns }, () => []);
    images.forEach((image, index) => cols[index % activeColumns].push({ image, index }));
    return cols;
  }, [images, activeColumns]);

  return (
    <div className="flex w-full items-start" style={{ gap }}>
      {buckets.map((bucket, colIndex) => (
        <div key={colIndex} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
          {bucket.map(({ image, index }) => (
            <GalleryCard
              key={image.id}
              image={image}
              index={index}
              variant={variant}
              aspect={ASPECTS[index % ASPECTS.length]}
              onOpen={onOpen}
              {...cardProps}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
