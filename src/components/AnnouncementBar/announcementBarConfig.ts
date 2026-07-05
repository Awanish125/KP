import navData from "@/data/nav.json";
import type { AnnouncementBarConfig } from "./announcementBarTypes";

/** Defaults come straight from nav.json — edit there, not here. */
export const ANNOUNCEMENT_BAR_DEFAULTS: AnnouncementBarConfig = {
  enabled: navData.announcement?.enabled ?? false,
  text: navData.announcement?.text ?? "",
  linkLabel: navData.announcement?.linkLabel ?? "Learn more",
  href: navData.announcement?.href ?? "/",
};

export const ANNOUNCEMENT_STORAGE_KEY = "kp-announce-dismissed";
export const ANNOUNCEMENT_HTML_CLASS = "kp-announce-visible";
