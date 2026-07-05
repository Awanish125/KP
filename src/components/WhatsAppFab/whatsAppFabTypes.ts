export interface WhatsAppFabConfig {
  /** wa.me link (from contact.json channels). */
  href: string;
  /** Label revealed on hover. */
  label: string;
  /** ms after load before the button pops in. */
  appearAfter: number;
}

export type WhatsAppFabProps = Partial<WhatsAppFabConfig>;
