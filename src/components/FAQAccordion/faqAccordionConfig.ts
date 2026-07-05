import faqData from "@/data/faq.json";
import type { FAQAccordionConfig } from "./faqAccordionTypes";

export const FAQ_ACCORDION_DEFAULTS: FAQAccordionConfig = {
  label: faqData.label,
  heading: faqData.heading,
  duration: 0.5,
};
