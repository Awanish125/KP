export interface FAQItem {
  q: string;
  a: string;
}

export interface FAQAccordionConfig {
  label: string;
  heading: string;
  /** Open/close tween duration in seconds. */
  duration: number;
}

export interface FAQAccordionProps extends Partial<FAQAccordionConfig> {
  items: FAQItem[];
  className?: string;
}
