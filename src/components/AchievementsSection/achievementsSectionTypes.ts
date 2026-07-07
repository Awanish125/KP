export interface AchievementStat {
  value: number;
  suffix: string;
  label: string;
  description: string;
  /** SVG icon key — used when `image` is absent. */
  icon: "calendar" | "billboard" | "eye" | "pin" | "users" | "clock";
  /** Optional image URL. When present, renders an <img> instead of the SVG icon. */
  image?: string;
  /** Alt text for the image (ignored when `image` is absent). */
  imageAlt?: string;
}

export interface AchievementsSectionProps {
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  stats?: AchievementStat[];
  tagline?: string;
  taglineAccent?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}
