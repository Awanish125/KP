export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterConfig {
  tagline: string;
  columns: FooterColumn[];
  social: Record<string, string>;
  legal: string;
}

export interface FooterProps extends Partial<FooterConfig> {
  className?: string;
}
