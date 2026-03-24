import { clsx, type ClassValue } from "clsx";
import { addDays, format, getISODay, parse } from "date-fns";
import { twMerge } from "tailwind-merge";

/** Merge classes value */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse given "yyyy-MM-dd" string to a `Date` object */
export const parseDate = (dateStr: string, ref: Date = new Date()) => {
  return parse(dateStr, "yyyy-MM-dd", ref);
};

/** Formats `Date` object to "yyyy-MM-dd" */
export const formatDate = (date: Date) => {
  return format(date, "yyyy-MM-dd");
};

/** Minutes since midnight to "HH:mm" format */
export const minutesToTime = (minutes: number | undefined | null) => {
  if (minutes === undefined || minutes === null) return "";
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

/** Time "HH:mm" format to minutes since midnight */
export const timeToMinutes = (time: string) => {
  if (!time) return undefined;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return undefined;
  return h * 60 + m;
};

/**
 * Given an array of ISO day numbers (1=Mon, 7=Sun), returns the nearest
 * future Date matching any of those days. Today counts if it matches.
 */
export const getNextOccurrence = (days: number[], from: Date = new Date()) => {
  if (days.length === 0) return from;
  const today = getISODay(from);
  if (days.includes(today)) return from;
  for (let offset = 1; offset <= 7; offset++) {
    const candidate = addDays(from, offset);
    if (days.includes(getISODay(candidate))) return candidate;
  }
  return from;
};

/** Handles general error */
export const handleThrowError = (e: unknown): never => {
  if (e instanceof Error) {
    throw new Error(e.message);
  }
  throw new Error("An unknown error occurred");
};
