import contactData from "@/data/contact.json";
import type { MediaKitButtonConfig } from "./mediaKitButtonTypes";

/** Defaults come straight from contact.json — edit there, not here. */
export const MEDIA_KIT_BUTTON_DEFAULTS: MediaKitButtonConfig = {
  label: contactData.mediaKit?.label ?? "Download Media Kit",
  file: contactData.mediaKit?.file ?? "/media/kp-media-kit.pdf",
  note: contactData.mediaKit?.note ?? "",
};
