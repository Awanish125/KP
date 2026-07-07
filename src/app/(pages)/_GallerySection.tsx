"use client";

import { useRouter } from "next/navigation";
import { CampaignGallery } from "@/components/gallery";
import type { Campaign } from "@/components/gallery";

interface Props {
  campaigns: Campaign[];
}

export function GallerySection({ campaigns }: Props) {
  const { push } = useRouter();
  return (
    <CampaignGallery
      campaigns={campaigns}
      glowColor="rgba(0,100,177,0.5)"
      enableFloating={false}
      enableGradientBorder={false}
      onCardClick={(card) => push(`/gallery?category=${encodeURIComponent(card.title)}`)}
    />
  );
}
