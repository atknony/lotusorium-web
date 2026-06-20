import type { ProductQuery } from "./api/storefront";
import type { FilterSelection } from "@/components/storefront/product-filters";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse storefront list/category search params (incl. `attr[key]=value`) into a
 * typed query for the API and a selection for the filter UI.
 */
export function parseStorefrontParams(raw: RawSearchParams) {
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const match = key.match(/^attr\[(.+)\]$/);
    if (match) {
      const v = first(value);
      if (v) attrs[match[1]] = v;
    }
  }

  const page = Math.max(1, parseInt(first(raw.page) ?? "1", 10) || 1);
  const category = first(raw.category);
  const search = first(raw.search);
  const featured = first(raw.featured) === "true";

  const selection: FilterSelection = { category, attrs };
  const query: ProductQuery = { category, search, featured, page, attrs };

  return { query, selection, page, search, category, featured };
}

/** Build the current query string without the `page` param (for pagination links). */
export function baseQueryWithoutPage(raw: RawSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (key === "page") continue;
    const v = first(value);
    if (v) params.set(key, v);
  }
  return params.toString();
}
