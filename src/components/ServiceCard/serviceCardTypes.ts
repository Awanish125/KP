export interface ServiceItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  features: string[];
}

export interface ServiceCardConfig {
  /** Max tilt in degrees. */
  maxTilt: number;
  /** Seconds for the tilt to catch up to the cursor. */
  tiltDuration: number;
  /** Hover lift in px. */
  lift: number;
}

export interface ServiceCardProps extends Partial<ServiceCardConfig> {
  item: ServiceItem;
  className?: string;
}
