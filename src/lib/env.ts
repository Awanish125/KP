/**
 * Typed environment config.
 * Import { env } from "@/lib/env" anywhere in the app.
 *
 * NEXT_PUBLIC_* values are safe on client + server.
 * All other values are server-only (never sent to the browser).
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function bool(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

export const env = {
  // --- App (public) ----------------------------------------
  appName:        optional("NEXT_PUBLIC_APP_NAME", "Kiran Publicity"),
  appUrl:         optional("NEXT_PUBLIC_APP_URL",  "http://localhost:3000"),
  appDescription: optional("NEXT_PUBLIC_APP_DESCRIPTION", "Outdoor Advertising Solutions"),

  // --- API -------------------------------------------------
  apiUrl:        optional("NEXT_PUBLIC_API_URL", "http://localhost:4000/api"),
  /** Server-only — never expose to client */
  apiSecretKey:  optional("API_SECRET_KEY"),

  // --- Analytics (public) ----------------------------------
  gaMeasurementId: optional("NEXT_PUBLIC_GA_MEASUREMENT_ID"),
  gtmId:           optional("NEXT_PUBLIC_GTM_ID"),

  // --- Email (server-only) ---------------------------------
  resendApiKey: optional("RESEND_API_KEY"),
  emailFrom:    optional("EMAIL_FROM", "noreply@kiranpublicity.com"),
  emailTo:      optional("EMAIL_TO",   "contact@kiranpublicity.com"),

  // --- Media / CDN (public) --------------------------------
  cdnUrl:              optional("NEXT_PUBLIC_CDN_URL", "http://localhost:3000"),
  cloudinaryCloudName: optional("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey:    optional("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: optional("CLOUDINARY_API_SECRET"),

  // --- Maps (public) ---------------------------------------
  googleMapsApiKey: optional("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),

  // --- Feature flags (public) ------------------------------
  enableAnimations:  bool("NEXT_PUBLIC_ENABLE_ANIMATIONS",  true),
  enable3D:          bool("NEXT_PUBLIC_ENABLE_3D",           true),
  maintenanceMode:   bool("NEXT_PUBLIC_MAINTENANCE_MODE",    false),

  // --- Derived helpers -------------------------------------
  isProd: process.env.NODE_ENV === "production",
  isDev:  process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test",
} as const;
