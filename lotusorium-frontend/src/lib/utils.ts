import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a numeric amount as Turkish Lira (e.g. 199.9 → "199,90 ₺"). */
export function formatTRY(
  amount: number | null | undefined,
  currency = "TRY",
): string | null {
  if (amount === null || amount === undefined) return null;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}