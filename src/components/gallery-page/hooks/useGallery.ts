"use client";

import { useMemo, useState } from "react";
import type { GalleryImage } from "../types/gallery";

interface UseGalleryOptions {
  images: GalleryImage[];
  pageSize: number;
  initialCategory?: string;
  enableLoadMore?: boolean;
}

export function useGallery({ images, pageSize, initialCategory = "All", enableLoadMore = true }: UseGalleryOptions) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(images.map((img) => img.category).filter(Boolean))) as string[];
    return ["All", ...unique];
  }, [images]);

  const filtered = useMemo(() => {
    let result = images;
    if (category !== "All") result = result.filter((img) => img.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (img) =>
          img.title?.toLowerCase().includes(q) ||
          img.location?.toLowerCase().includes(q) ||
          img.category?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [images, category, search]);

  // Without load-more, every matching image renders at once — no slicing.
  const visible = enableLoadMore ? filtered.slice(0, visibleCount) : filtered;
  const hasMore = enableLoadMore && visibleCount < filtered.length;
  const loadMore = () => setVisibleCount((v) => v + pageSize);

  const setCategoryAndReset = (c: string) => {
    setCategory(c);
    setVisibleCount(pageSize);
  };
  const setSearchAndReset = (s: string) => {
    setSearch(s);
    setVisibleCount(pageSize);
  };

  return {
    categories,
    category,
    setCategory: setCategoryAndReset,
    search,
    setSearch: setSearchAndReset,
    filtered,
    visible,
    hasMore,
    loadMore,
  };
}
