export type GalleryCardVariant =
  | "default"
  | "glass"
  | "minimal"
  | "floating"
  | "premium"
  | "stack"
  | "wide"
  | "editorial";

export interface GalleryImage {
  id: string;
  src: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  photographer?: string;
  date?: string;
  views?: number;
  likes?: number;
  width?: number;
  height?: number;
}

export interface GalleryPageProps {
  images: GalleryImage[];

  title?: string;
  subtitle?: string;
  description?: string;

  columns?: number;
  gap?: string;
  cardVariant?: GalleryCardVariant;
  carouselEffect?: string;

  initialCategory?: string;
  enableSearch?: boolean;
  enableCategoryFilter?: boolean;
  enableLoadMore?: boolean;
  pageSize?: number;

  enableGlass?: boolean;
  enableGlow?: boolean;
  enableNoise?: boolean;
  enableParallax?: boolean;
  enableTilt?: boolean;
  enableFloating?: boolean;
  enableBorderAnimation?: boolean;
  enableImageZoom?: boolean;
  enableLightSweep?: boolean;

  enableTitle?: boolean;
  enableDescription?: boolean;
  enableCategoryBadge?: boolean;
  enableLocation?: boolean;
  enableDate?: boolean;
  enableViews?: boolean;
  enableLikes?: boolean;

  enableKeyboard?: boolean;
  enableSwipe?: boolean;
  enableMouseWheel?: boolean;
  enableCounter?: boolean;

  primaryColor?: string;
  accentColor?: string;
  borderRadius?: string;
  hoverScale?: number;
  revealDuration?: number;
}
