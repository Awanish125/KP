"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GalleryPage } from "@/components/gallery-page";
import { GALLERY_PHOTOS } from "@/data/gallery-photos";

function GalleryContent() {
  // Set by the homepage category cards (`/gallery?category=Transit`) so the
  // gallery opens already filtered — no re-selection needed after landing.
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "All";

  return (
    <GalleryPage
      images={GALLERY_PHOTOS}
      title="The Gallery"
      subtitle="Visual Archive"
      description="Every campaign we've shot, staged, and lit — browse the full archive across billboards, transit, digital, and events."
      columns={4}
      carouselEffect="coverflow"
      initialCategory={initialCategory}
      enableLoadMore={false}
    />
  );
}

export default function Gallery() {
  return (
    <div style={{ overflowX: "clip" }}>
      {/* useSearchParams requires a Suspense boundary for prerendering */}
      <Suspense fallback={null}>
        <GalleryContent />
      </Suspense>
    </div>
  );
}
