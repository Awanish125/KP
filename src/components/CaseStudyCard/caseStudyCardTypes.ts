export interface CaseStudyResults {
  impressions: string;
  sites: string;
  cities: string;
  upliftLabel: string;
  uplift: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  brand: string;
  category: string;
  year: string;
  hero: string;
  images: string[];
  results: CaseStudyResults;
  summary: string;
  body: string[];
  quote: { text: string; name: string; role: string };
}

export interface CaseStudyCardConfig {
  /** Hover zoom on the cover image. */
  hoverScale: number;
}

export interface CaseStudyCardProps extends Partial<CaseStudyCardConfig> {
  study: CaseStudy;
  onOpen: (study: CaseStudy) => void;
  className?: string;
}
