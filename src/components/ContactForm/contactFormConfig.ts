import contactData from "@/data/contact.json";
import type { ContactField, ContactFormConfig } from "./contactFormTypes";

/** Defaults come straight from the JSON data layer. */
export const CONTACT_FORM_DEFAULTS: ContactFormConfig = {
  fields: contactData.fields as ContactField[],
  submitLabel: contactData.submitLabel,
  successMessage: contactData.successMessage,
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Loose international phone check — at least 8 digits among allowed chars. */
export const PHONE_RE = /^[+\d][\d\s\-()]{7,}$/;
