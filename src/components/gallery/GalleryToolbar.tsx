"use client";

import { useState } from "react";
import { Search, LayoutGrid, List, ChevronDown } from "lucide-react";
import type { GallerySortKey, GalleryView } from "./types/gallery";
import { cn } from "./utils/cn";

const SORT_OPTIONS: { key: GallerySortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "views", label: "Most viewed" },
  { key: "likes", label: "Most liked" },
  { key: "alpha", label: "A → Z" },
];

interface GalleryToolbarProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sort: GallerySortKey;
  onSortChange: (sort: GallerySortKey) => void;
  view: GalleryView;
  onViewChange: (view: GalleryView) => void;
  enableSearch?: boolean;
  enableSorting?: boolean;
  enableCategoryFilter?: boolean;
  enableViewSwitch?: boolean;
}

export function GalleryToolbar({
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  enableSearch = true,
  enableSorting = true,
  enableCategoryFilter = true,
  enableViewSwitch = true,
}: GalleryToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      {enableCategoryFilter && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition-all duration-300",
                  active
                    ? "border-primary bg-primary text-white shadow-[0_4px_16px_rgba(0,100,177,0.35)]"
                    : "border-black/10 text-text-muted hover:border-primary/40 hover:text-primary dark:border-white/10 dark:text-white/60 dark:hover:text-white",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        {enableSearch && (
          <div className="group relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search campaigns..."
              aria-label="Search campaigns"
              className="w-44 rounded-full border border-black/10 bg-white/70 py-2 pl-9 pr-4 text-sm text-text outline-none transition-all duration-300 focus:w-60 focus:border-primary/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>
        )}

        {enableSorting && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              onBlur={() => setTimeout(() => setSortOpen(false), 120)}
              className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-text dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              {SORT_OPTIONS.find((o) => o.key === sort)?.label}
              <ChevronDown size={14} className={cn("transition-transform duration-300", sortOpen && "rotate-180")} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-secondary">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onMouseDown={() => onSortChange(option.key)}
                    className={cn(
                      "block w-full px-4 py-2 text-left text-sm hover:bg-primary/10",
                      sort === option.key && "text-primary",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {enableViewSwitch && (
          <div className="flex rounded-full border border-black/10 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.04]">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => onViewChange("grid")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                view === "grid" ? "bg-primary text-white" : "text-text-muted",
              )}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => onViewChange("list")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                view === "list" ? "bg-primary text-white" : "text-text-muted",
              )}
            >
              <List size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
