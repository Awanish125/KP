export interface Office {
  city: string;
  /** Badge, e.g. "HQ", "Bihar", "Pan-India". */
  tag: string;
  address: string;
}

export interface OfficeGridConfig {
  label: string;
  heading: string;
}

export interface OfficeGridProps extends Partial<OfficeGridConfig> {
  offices: Office[];
  className?: string;
}
