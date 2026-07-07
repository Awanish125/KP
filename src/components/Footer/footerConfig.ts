import footerData from "@/data/footer.json";
import type { FooterConfig } from "./footerTypes";

/** Defaults come straight from the JSON data layer. */
export const FOOTER_DEFAULTS: FooterConfig = {
  tagline: footerData.tagline,
  columns: footerData.columns,
  social: footerData.social,
  legal: footerData.legal,
};
