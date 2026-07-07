import clientsData from "@/data/clients.json";
import type { ClientLogoWallConfig } from "./clientLogoWallTypes";

export const CLIENT_LOGO_WALL_DEFAULTS: ClientLogoWallConfig = {
  label: clientsData.label,
  heading: clientsData.heading,
};
