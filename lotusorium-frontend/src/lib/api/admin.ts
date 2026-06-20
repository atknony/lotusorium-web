import { bffFetch } from "./bff-client";
import type {
  AdminAttributeDefinition,
  AdminCategory,
  AdminCategoryDetail,
  AdminProduct,
  AdminProductImage,
  AdminUser,
  AttributeDefinitionWritePayload,
  AuditLog,
  AuditLogFilters,
  CategoryWritePayload,
  ClickAnalyticsResponse,
  CreateAdminUserPayload,
  Paginated,
  ProductStatus,
  ProductWritePayload,
  UpdateAdminUserPayload,
  UploadSignature,
} from "./types";

const BFF = "/api/bff/admin";

/** Centralised TanStack Query keys for cache invalidation. */
export const adminKeys = {
  dashboard: ["admin", "dashboard"] as const,
  categories: ["admin", "categories"] as const,
  category: (id: string) => ["admin", "categories", id] as const,
  products: (filters?: ProductFilters) =>
    ["admin", "products", filters ?? {}] as const,
  product: (id: string) => ["admin", "products", "detail", id] as const,
  productImages: (productId: string) =>
    ["admin", "products", productId, "images"] as const,
  featured: ["admin", "featured"] as const,
  analytics: (from?: string, to?: string) =>
    ["admin", "analytics", { from: from ?? null, to: to ?? null }] as const,
  users: ["admin", "users"] as const,
  auditLogs: (filters: AuditLogFilters) =>
    ["admin", "audit-logs", filters] as const,
};

function jsonBody(value: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(value) };
}

/* --- Categories ------------------------------------------------------------ */

export const getCategories = () =>
  bffFetch<AdminCategory[]>(`${BFF}/categories`);

export const getCategory = (id: string) =>
  bffFetch<AdminCategoryDetail>(`${BFF}/categories/${id}`);

export const createCategory = (payload: CategoryWritePayload) =>
  bffFetch<AdminCategory>(`${BFF}/categories`, jsonBody(payload));

export const updateCategory = (id: string, payload: CategoryWritePayload) =>
  bffFetch<AdminCategory>(`${BFF}/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteCategory = (id: string) =>
  bffFetch<{ success: boolean }>(`${BFF}/categories/${id}`, {
    method: "DELETE",
  });

/* --- Attribute definitions (nested under a category) ----------------------- */

export const createAttribute = (
  categoryId: string,
  payload: AttributeDefinitionWritePayload,
) =>
  bffFetch<AdminAttributeDefinition>(
    `${BFF}/categories/${categoryId}/attributes`,
    jsonBody(payload),
  );

export const updateAttribute = (
  categoryId: string,
  id: string,
  payload: Partial<AttributeDefinitionWritePayload>,
) =>
  bffFetch<AdminAttributeDefinition>(
    `${BFF}/categories/${categoryId}/attributes/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );

export const deleteAttribute = (categoryId: string, id: string) =>
  bffFetch<{ success: boolean }>(
    `${BFF}/categories/${categoryId}/attributes/${id}`,
    { method: "DELETE" },
  );

/* --- Products -------------------------------------------------------------- */

export interface ProductFilters {
  categoryId?: string;
  status?: ProductStatus;
  search?: string;
}

export function getProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return bffFetch<AdminProduct[]>(`${BFF}/products${qs ? `?${qs}` : ""}`);
}

export const getProduct = (id: string) =>
  bffFetch<AdminProduct>(`${BFF}/products/${id}`);

export const createProduct = (payload: ProductWritePayload) =>
  bffFetch<AdminProduct>(`${BFF}/products`, jsonBody(payload));

export const updateProduct = (id: string, payload: ProductWritePayload) =>
  bffFetch<AdminProduct>(`${BFF}/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteProduct = (id: string) =>
  bffFetch<{ success: boolean }>(`${BFF}/products/${id}`, { method: "DELETE" });

export const restoreProduct = (id: string) =>
  bffFetch<AdminProduct>(`${BFF}/products/${id}/restore`, { method: "POST" });

/* --- Product images -------------------------------------------------------- */

export interface CreateImagePayload {
  cloudinaryPublicId: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
  isPrimary?: boolean;
}

export const getProductImages = (productId: string) =>
  bffFetch<AdminProductImage[]>(`${BFF}/products/${productId}/images`);

export const addProductImage = (
  productId: string,
  payload: CreateImagePayload,
) =>
  bffFetch<AdminProductImage>(
    `${BFF}/products/${productId}/images`,
    jsonBody(payload),
  );

export const updateProductImage = (
  productId: string,
  imageId: string,
  payload: { altText?: string; isPrimary?: boolean },
) =>
  bffFetch<AdminProductImage>(
    `${BFF}/products/${productId}/images/${imageId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );

export const deleteProductImage = (productId: string, imageId: string) =>
  bffFetch<{ success: boolean }>(
    `${BFF}/products/${productId}/images/${imageId}`,
    { method: "DELETE" },
  );

export const reorderProductImages = (productId: string, orderedIds: string[]) =>
  bffFetch<AdminProductImage[]>(`${BFF}/products/${productId}/images/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ orderedIds }),
  });

/* --- Media (Cloudinary signing) -------------------------------------------- */

export const signUpload = (folder?: string) =>
  bffFetch<UploadSignature>(`${BFF}/media/sign`, jsonBody(folder ? { folder } : {}));

/* --- Featured -------------------------------------------------------------- */

export const getFeatured = () =>
  bffFetch<AdminProduct[]>(`${BFF}/featured`);

export const setFeatured = (productIds: string[]) =>
  bffFetch<AdminProduct[]>(`${BFF}/featured`, {
    method: "PUT",
    body: JSON.stringify({ productIds }),
  });

/* --- Analytics ------------------------------------------------------------- */

export function getAnalyticsClicks(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return bffFetch<ClickAnalyticsResponse>(
    `${BFF}/analytics/clicks${qs ? `?${qs}` : ""}`,
  );
}

export const refreshAnalytics = () =>
  bffFetch<{ refreshed: number }>(`${BFF}/analytics/refresh`, {
    method: "POST",
  });

/* --- Admin users (super_admin only) ---------------------------------------- */

export const getUsers = () => bffFetch<AdminUser[]>(`${BFF}/users`);

export const createUser = (payload: CreateAdminUserPayload) =>
  bffFetch<AdminUser>(`${BFF}/users`, jsonBody(payload));

export const updateUser = (id: string, payload: UpdateAdminUserPayload) =>
  bffFetch<AdminUser>(`${BFF}/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteUser = (id: string) =>
  bffFetch<{ success: boolean }>(`${BFF}/users/${id}`, { method: "DELETE" });

/* --- Audit logs (super_admin only) ----------------------------------------- */

export function getAuditLogs(filters: AuditLogFilters) {
  const params = new URLSearchParams();
  if (filters.adminUserId) params.set("adminUserId", filters.adminUserId);
  if (filters.action) params.set("action", filters.action);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return bffFetch<Paginated<AuditLog>>(
    `${BFF}/audit-logs${qs ? `?${qs}` : ""}`,
  );
}
