import type { GalleryImage } from "@/components/gallery-page";

const CATEGORIES = ["Billboards", "Transit", "Digital", "Events", "Retail", "Skyline", "Nightlife", "Portraits"];
const LOCATIONS = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Chandigarh",
];
const PHOTOGRAPHERS = ["A. Rao", "S. Mehta", "K. Iyer", "R. Singh", "P. Nair", "T. Kapoor"];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

export const GALLERY_PHOTOS: GalleryImage[] = Array.from({ length: 50 }, (_, i) => {
  const n = i + 1;
  const seed = `kpgallery${n}`;
  const category = pick(CATEGORIES, i);
  const location = pick(LOCATIONS, i + 2);
  const photographer = pick(PHOTOGRAPHERS, i);

  // Deliberately omit some optional fields on a rotating basis, so the
  // "never render an empty placeholder" rule is actually exercised.
  const hasDescription = i % 4 !== 0;
  const hasDate = i % 5 !== 0;
  const hasPhotographer = i % 3 !== 0;
  const hasStats = i % 6 !== 0;
  const hasTitle = i % 9 !== 0;

  return {
    id: `photo-${n}`,
    src: `https://picsum.photos/seed/${seed}/900/${700 + ((i * 37) % 400)}`,
    title: hasTitle ? `${category} Story ${n}` : undefined,
    description: hasDescription
      ? `A ${category.toLowerCase()} placement captured on location in ${location}, showcasing scale and craft.`
      : undefined,
    category,
    location,
    photographer: hasPhotographer ? photographer : undefined,
    date: hasDate ? `${2023 + (i % 3)}-${String((i % 12) + 1).padStart(2, "0")}` : undefined,
    views: hasStats ? 4000 + i * 733 : undefined,
    likes: hasStats ? 80 + i * 17 : undefined,
  };
});
