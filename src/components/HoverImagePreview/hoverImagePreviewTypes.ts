export interface HoverImagePreviewConfig {
  /** Frame width in px. */
  width: number;
  /** Cursor-follow lerp per tick. */
  lerp: number;
  /** Offset from the cursor in px. */
  offsetX: number;
  offsetY: number;
}

export interface HoverImagePreviewProps extends Partial<HoverImagePreviewConfig> {
  /** Image to float beside the cursor; null hides the preview. */
  src: string | null;
  alt?: string;
}
