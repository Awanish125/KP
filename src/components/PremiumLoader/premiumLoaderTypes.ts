export interface PremiumLoaderConfig {
  /** Wordmark lines. */
  word1: string;
  word2: string;
  /** Seconds for the 0→100 count. */
  countDuration: number;
  /** Seconds for the exit wipe. */
  exitDuration: number;
}

export type PremiumLoaderProps = Partial<PremiumLoaderConfig>;
