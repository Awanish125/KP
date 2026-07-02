import { SearchX } from "lucide-react";

export function GalleryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-black/10 py-24 text-center dark:border-white/10">
      <SearchX size={28} className="text-text-muted" />
      <p className="text-sm text-text-muted">No campaigns match your filters.</p>
    </div>
  );
}
