import footerData from "@/data/footer.json";
import type { Credential } from "./credentialsStripTypes";

/** Defaults come straight from footer.json — edit there, not here. */
export const CREDENTIALS_STRIP_DEFAULTS: Credential[] = footerData.credentials ?? [];
