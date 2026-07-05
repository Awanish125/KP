export interface ProcessStep {
  label: string;
  /** May contain \n for a manual line break. */
  heading: string;
  body: string;
}

export interface ProcessStepsConfig {
  label: string;
  heading: string;
}

export interface ProcessStepsProps extends Partial<ProcessStepsConfig> {
  steps: ProcessStep[];
  className?: string;
}
