import { GALLERY_PHOTOS } from "./gallery-photos";

export interface GalleryCategory {
  name: string;
  /** Cover image shown on the homepage category card.
   *  REPLACE THIS with your own image per category — e.g. "/categories/billboards.jpg"
   *  (put files in /public/categories/). Nothing else needs to change. */
  image: string;
  count: number;
}

// Derived from the gallery data so counts stay accurate. The `image` fallback
// is simply each category's first photo — override it below as needed.
const grouped = new Map<string, { image: string; count: number }>();
for (const photo of GALLERY_PHOTOS) {
  if (!photo.category) continue;
  const entry = grouped.get(photo.category);
  if (entry) entry.count += 1;
  else grouped.set(photo.category, { image: photo.src, count: 1 });
}

/** Per-category cover overrides — put your real category images here. */
const COVER_OVERRIDES: Record<string, string> = {
  // Billboards: "/categories/billboards.jpg",
  // Transit: "/categories/transit.jpg",
};

export const GALLERY_CATEGORIES: GalleryCategory[] = [...grouped.entries()].map(([name, { image, count }]) => ({
  name,
  image: COVER_OVERRIDES[name] ?? image,
  count,
}));
