import type { FilterableAttribute } from "./api/types";

function capitalize(s: string): string {
  return s ? s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1) : s;
}

/** "burn_time" → "Burn Time" (fallback when no admin-defined label exists). */
export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toLocaleUpperCase("tr-TR"));
}

function formatValue(value: unknown, unit?: string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (Array.isArray(value)) {
    return value.map((v) => capitalize(String(v))).join(", ");
  }
  const base =
    typeof value === "number" ? String(value) : capitalize(String(value));
  return unit ? `${base} ${unit}` : base;
}

export interface AttributeRow {
  key: string;
  label: string;
  value: string;
}

/**
 * Build display rows for a product's JSONB attributes, preferring admin-defined
 * labels/units from the category's attribute definitions, humanizing the key
 * for anything without a public definition.
 */
export function buildAttributeRows(
  attributes: Record<string, unknown>,
  defs: FilterableAttribute[] = [],
): AttributeRow[] {
  const byKey = new Map(defs.map((d) => [d.key, d]));
  return Object.entries(attributes ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([key, value]) => {
      const def = byKey.get(key);
      return {
        key,
        label: def?.label ?? humanizeKey(key),
        value: formatValue(value, def?.unit),
      };
    });
}
