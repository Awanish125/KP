export interface ServicesStripItem {
  title: string;
  description: string;
}

export interface ServicesStripConfig {
  label: string;
  heading: string;
  headingEmphasis: string;
  /** Where the whole strip links to. */
  href: string;
  linkLabel: string;
}

export interface ServicesStripProps extends Partial<ServicesStripConfig> {
  items: ServicesStripItem[];
  className?: string;
}
