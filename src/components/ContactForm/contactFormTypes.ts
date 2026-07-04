export type ContactFieldType = "text" | "email" | "tel" | "select" | "textarea";

export interface ContactField {
  name: string;
  label: string;
  type: ContactFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface ContactFormConfig {
  fields: ContactField[];
  submitLabel: string;
  successMessage: string;
}

export interface ContactFormProps extends Partial<ContactFormConfig> {
  className?: string;
  /** Called with the validated values on submit. */
  onSubmit?: (values: Record<string, string>) => void | Promise<void>;
}
