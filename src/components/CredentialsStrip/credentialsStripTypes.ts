export interface Credential {
  label: string;
  value: string;
}

export interface CredentialsStripProps {
  /** Defaults to footer.json credentials. */
  credentials?: Credential[];
  className?: string;
}
