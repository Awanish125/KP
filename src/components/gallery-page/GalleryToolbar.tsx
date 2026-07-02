"use client";

import { Search } from "lucide-react";
import { cn } from "../gallery/utils/cn";

interface GalleryToolbarProps {
  enableSearch?: boolean;
  enableCategoryFilter?: boolean;
  categories: string[];
  category: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function GalleryToolbar({
  enableSearch = true,
  enableCategoryFilter = true,
  categories,
  category,
  onCategoryChange,
  search,
  onSearchChange,
}: GalleryToolbarProps) {
  if (!enableSearch && !enableCategoryFilter) return null;

  return (
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      {enableCategoryFilter && categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCategoryChange(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition-all duration-300",
                  active
                    ? "border-primary bg-primary text-white shadow-[0_4px_16px_rgba(0,100,177,0.35)]"
                    : "border-black/10 text-text-muted hover:border-primary/40 hover:text-primary dark:border-white/10 dark:text-white/60 dark:hover:text-white",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

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
            placeholder="Search photographs..."
            aria-label="Search gallery"
            className="w-48 rounded-full border border-black/10 bg-white/70 py-2 pl-9 pr-4 text-sm text-text outline-none transition-all duration-300 focus:w-64 focus:border-primary/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          />
        </div>
      )}
    </div>
  );
}
