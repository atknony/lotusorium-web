import type { AttributeDefinition } from "./api/types";

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
 * Build display rows for a product's JSONB attributes, using the category's
 * attribute definitions for human-readable labels/units. Rows follow the
 * admin-defined attribute order; any saved key without a matching definition
 * is appended with a humanized fallback label.
 */
export function buildAttributeRows(
  attributes: Record<string, unknown>,
  defs: AttributeDefinition[] = [],
): AttributeRow[] {
  const present = Object.entries(attributes ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  const values = new Map(present.map(([key, value]) => [key, value]));
  const rows: AttributeRow[] = [];
  const seen = new Set<string>();

  // Defined attributes first, in admin sort order.
  for (const def of defs) {
    if (!values.has(def.key)) continue;
    rows.push({
      key: def.key,
      label: def.label,
      value: formatValue(values.get(def.key), def.unit),
    });
    seen.add(def.key);
  }

  // Then any saved attributes without a definition (humanized fallback).
  for (const [key, value] of present) {
    if (seen.has(key)) continue;
    rows.push({ key, label: humanizeKey(key), value: formatValue(value) });
  }

  return rows;
}
