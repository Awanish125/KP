export interface BeforeAfterSliderConfig {
  /** Starting handle position, 0–100. */
  initial: number;
  beforeLabel: string;
  afterLabel: string;
  aspectRatio: string;
}

export interface BeforeAfterSliderProps extends Partial<BeforeAfterSliderConfig> {
  before: string;
  after: string;
  alt: string;
  className?: string;
}
