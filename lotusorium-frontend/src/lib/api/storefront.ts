import { apiServer } from "./server";
import type {
  CategoryDetailResponse,
  CategoryNode,
  Paginated,
  ProductDetailResponse,
  ProductListItem,
} from "./types";

/** Public storefront read functions — thin typed wrappers over the NestJS API. */

export interface ProductQuery {
  category?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  /** Attribute facets → serialized as attr[key]=value (backend single-value). */
  attrs?: Record<string, string>;
}

export function buildProductQuery(q: ProductQuery): string {
  const sp = new URLSearchParams();
  if (q.category) sp.set("category", q.category);
  if (q.featured) sp.set("featured", "true");
  if (q.search) sp.set("search", q.search);
  if (q.page && q.page > 1) sp.set("page", String(q.page));
  if (q.limit) sp.set("limit", String(q.limit));
  if (q.attrs) {
    for (const [key, value] of Object.entries(q.attrs)) {
      if (value) sp.set(`attr[${key}]`, value);
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function getFeatured() {
  return apiServer<ProductListItem[]>("/featured", {
    revalidate: 120,
    tags: ["featured"],
  });
}

export function getCategories() {
  return apiServer<CategoryNode[]>("/categories", {
    revalidate: 300,
    tags: ["categories"],
  });
}

export function getProducts(query: ProductQuery = {}) {
  return apiServer<Paginated<ProductListItem>>(
    `/products${buildProductQuery(query)}`,
    { revalidate: 60, tags: ["products"] },
  );
}

export function getCategoryBySlug(slug: string, query: ProductQuery = {}) {
  return apiServer<CategoryDetailResponse>(
    `/categories/${encodeURIComponent(slug)}${buildProductQuery(query)}`,
    { revalidate: 60, tags: ["categories", `category:${slug}`] },
  );
}

/** Product detail (used in Phase 3). */
export function getProductBySlug(slug: string) {
  return apiServer<ProductDetailResponse>(
    `/products/${encodeURIComponent(slug)}`,
    { revalidate: 60, tags: ["products", `product:${slug}`] },
  );
}
