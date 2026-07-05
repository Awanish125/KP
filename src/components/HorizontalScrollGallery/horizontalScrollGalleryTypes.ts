export interface HorizontalGalleryItem {
  image: string;
  title: string;
  meta: string;
  href?: string;
}

export interface HorizontalScrollGalleryConfig {
  label: string;
  heading: string;
  /** Extra scroll length per item, in viewport-heights. */
  vhPerItem: number;
  /** Track lerp per tick. */
  lerp: number;
}

export interface HorizontalScrollGalleryProps
  extends Partial<HorizontalScrollGalleryConfig> {
  items: HorizontalGalleryItem[];
  className?: string;
}
