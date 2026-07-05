import type { CaseStudy } from "@/components/CaseStudyCard";

export interface CaseStudyModalConfig {
  /** Entrance duration in seconds. */
  duration: number;
  ease: string;
}

export interface CaseStudyModalProps extends Partial<CaseStudyModalConfig> {
  study: CaseStudy | null;
  onClose: () => void;
}
