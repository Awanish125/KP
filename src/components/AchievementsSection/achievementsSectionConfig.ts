import type { AchievementStat, AchievementsSectionProps } from "./achievementsSectionTypes";

export const DEFAULT_STATS: AchievementStat[] = [
  {
    value: 27,
    suffix: "+",
    label: "Years in Business",
    description: "Continuously operating since 1998 — through three decades of India's growth story.",
    icon: "calendar",
  },
  {
    value: 400,
    suffix: "+",
    label: "Media Sites Owned",
    description: "Premium hoardings, transit panels, and LED screens — all owned assets, zero leased.",
    icon: "billboard",
  },
  {
    value: 48,
    suffix: "M+",
    label: "Monthly Impressions",
    description: "Verified eyes across every format — measured by third-party traffic survey data.",
    icon: "eye",
  },
  {
    value: 12,
    suffix: "",
    label: "Cities Covered",
    description: "From Patna and Ranchi to Mumbai — with Bihar and Jharkhand at the heart of the network.",
    icon: "pin",
  },
  {
    value: 500,
    suffix: "+",
    label: "Campaigns Delivered",
    description: "Local SMBs to national FMCG launches — every brief handled end to end, on proof.",
    icon: "users",
  },
  {
    value: 72,
    suffix: "hr",
    label: "Campaign Launch Window",
    description: "Brief to live installation in under 72 hours — nobody in eastern India moves faster.",
    icon: "clock",
  },
];

export const ACHIEVEMENTS_DEFAULTS: Required<
  Pick<AchievementsSectionProps, "eyebrow" | "heading" | "headingAccent" | "tagline" | "taglineAccent" | "ctaLabel" | "ctaHref">
> = {
  eyebrow: "By the Numbers",
  heading: "27 years of engineering",
  headingAccent: "attention across India.",
  tagline: "Bihar and Jharkhand's",
  taglineAccent: "largest independent outdoor network.",
  ctaLabel: "Start a Campaign",
  ctaHref: "/contact",
};
