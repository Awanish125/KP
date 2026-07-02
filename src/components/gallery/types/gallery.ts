export type GalleryView = "grid" | "list";

export type GallerySortKey = "featured" | "newest" | "views" | "likes" | "alpha";

export type GalleryCardSize = "sm" | "md" | "lg" | "wide" | "tall";

export interface Campaign {
  id: string;
  title: string;
  category: string;
  location: string;
  duration: string;
  type: string;
  image: string;
  description?: string;
  views?: number;
  likes?: number;
  featured?: boolean;
  glowColor?: string;
  size?: GalleryCardSize;
  href?: string;
}

export interface CampaignGalleryProps {
  campaigns: Campaign[];
  loading?: boolean;

  title?: string;
  description?: string;
  showStats?: boolean;

  darkMode?: boolean;
  columns?: number;
  containerWidth?: string;
  cardRadius?: string;
  padding?: string;
  gap?: string;

  primaryColor?: string;
  accentColor?: string;
  glowColor?: string;
  gradientColors?: [string, string];

  imageFit?: "cover" | "contain";

  enableGlass?: boolean;
  enableGlow?: boolean;
  enableGradientBorder?: boolean;
  enableMouseTilt?: boolean;
  enableFloating?: boolean;
  enableNoise?: boolean;
  enableScrollReveal?: boolean;

  animationSpeed?: number;
  staggerDelay?: number;
  tiltStrength?: number;
  hoverScale?: number;

  onCardClick?: (campaign: Campaign) => void;
}
