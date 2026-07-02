import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Deterministic thousands-separator formatting. `Number.prototype.toLocaleString()`
 * without a fixed locale depends on the runtime's default locale, which can
 * differ between server and client and trigger hydration mismatches.
 */
export function formatCount(value: number) {
  return value.toLocaleString("en-US");
}
