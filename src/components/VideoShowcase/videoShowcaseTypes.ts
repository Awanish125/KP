export interface VideoShowcaseConfig {
  label: string;
  heading: string;
  cta: string;
  /** Video file (public/ path or URL). Used for both loop and lightbox. */
  src: string;
}

export type VideoShowcaseProps = Partial<VideoShowcaseConfig> & {
  className?: string;
};
