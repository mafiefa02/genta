import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge. Useful for handling conditional classes and
 * resolving Tailwind conflicts.
 *
 * @param inputs - A list of class values to be merged.
 * @returns The consolidated and de-duplicated class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
