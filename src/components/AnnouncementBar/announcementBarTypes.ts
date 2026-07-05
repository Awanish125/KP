export interface AnnouncementBarConfig {
  enabled: boolean;
  text: string;
  linkLabel: string;
  href: string;
}

export interface AnnouncementBarProps extends Partial<AnnouncementBarConfig> {
  /** sessionStorage key remembering a dismissal. */
  storageKey?: string;
}
