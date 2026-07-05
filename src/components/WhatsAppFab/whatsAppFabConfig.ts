import contactData from "@/data/contact.json";
import type { WhatsAppFabConfig } from "./whatsAppFabTypes";

const whatsapp = contactData.channels.find((c) => c.id === "whatsapp");

export const WHATSAPP_FAB_DEFAULTS: WhatsAppFabConfig = {
  href: whatsapp?.href ?? "https://wa.me/919822044210",
  label: "Chat with a planner",
  appearAfter: 1800,
};
