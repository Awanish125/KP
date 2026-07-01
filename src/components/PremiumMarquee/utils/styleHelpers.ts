import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// Merges Tailwind classes correctly — resolves conflicts (e.g. p-2 + p-4 → p-4)
export function cx(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
