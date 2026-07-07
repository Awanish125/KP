export interface MediaKitButtonConfig {
  label: string;
  /** Public path of the PDF. */
  file: string;
  note: string;
}

export type MediaKitButtonProps = Partial<MediaKitButtonConfig> & {
  className?: string;
};
