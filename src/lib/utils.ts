import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

function parseDate(value: string | FirestoreTimestamp | null | undefined): Date {
  if (!value) return new Date();
  if (typeof value === "object" && "_seconds" in value) {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1000000);
  }
  return new Date(value);
}

export function formatDate(
  value: string | FirestoreTimestamp | null | undefined
): string {
  return format(parseDate(value), "d MMMM yyyy");
}

/**
 * Format a date string or Date object to a human-readable UK format.
 * e.g. "9 March 2026"
 */
export function formatDateStr(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
