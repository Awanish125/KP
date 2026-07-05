export interface ClientIndustry {
  name: string;
  brands: string[];
}

export interface ClientLogoWallConfig {
  label: string;
  heading: string;
}

export interface ClientLogoWallProps extends Partial<ClientLogoWallConfig> {
  industries: ClientIndustry[];
  className?: string;
}
