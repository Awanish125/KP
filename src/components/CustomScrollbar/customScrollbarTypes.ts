export interface CustomScrollbarConfig {
  /** Track width in px (thumb inherits). */
  width: number;
  /** Gap from viewport edges in px. */
  inset: number;
  /** Minimum thumb height in px. */
  minThumb: number;
  /** ms of scroll inactivity before the bar fades out. */
  hideAfter: number;
}

export type CustomScrollbarProps = Partial<CustomScrollbarConfig>;
