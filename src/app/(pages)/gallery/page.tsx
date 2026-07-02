"use client";

import { GalleryPage } from "@/components/gallery-page";
import { GALLERY_PHOTOS } from "@/data/gallery-photos";

export default function Gallery() {
  return (
    <div className="bg-white dark:bg-secondary" style={{ overflowX: "clip" }}>
      <GalleryPage
        images={GALLERY_PHOTOS}
        title="The Gallery"
        subtitle="Visual Archive"
        description="Every campaign we've shot, staged, and lit — browse the full archive across billboards, transit, digital, and events."
        columns={4}
        carouselEffect="coverflow"
      />
    </div>
  );
}
