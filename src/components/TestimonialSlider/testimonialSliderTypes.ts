export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface TestimonialSliderConfig {
  /** Base drift speed, px per second. */
  speed: number;
  /** How quickly speed eases toward its target (0–1 per tick). */
  lerp: number;
  /** Gap between cards in px. */
  gap: number;
  /** Card width in px (clamped by viewport via CSS). */
  cardWidth: number;
}

export interface TestimonialSliderProps extends Partial<TestimonialSliderConfig> {
  items: Testimonial[];
  className?: string;
}
