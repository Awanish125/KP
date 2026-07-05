export interface CTABannerConfig {
  heading: string;
  sub: string;
  button: { label: string; href: string };
}

export interface CTABannerProps extends Partial<CTABannerConfig> {
  className?: string;
}
