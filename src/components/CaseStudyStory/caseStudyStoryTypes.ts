import type { CaseStudy } from "@/components/CaseStudyCard";

export interface CaseStudyStoryProps {
  study: CaseStudy;
  /** Prev / next studies for the footer navigation. */
  prev: Pick<CaseStudy, "slug" | "title" | "brand">;
  next: Pick<CaseStudy, "slug" | "title" | "brand">;
}
