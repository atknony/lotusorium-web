/**
 * Hand-authored mirror of the NestJS public API response shapes
 * (the contract between this frontend and lotusorium-api). Admin shapes are
 * added in the admin phases.
 */

export type FulfillmentChannel = "trendyol" | "onsite";
export type ProductStatus = "draft" | "published" | "archived";
export type AttributeDataType =
  | "text"
  | "number"
  | "boolean"
  | "enum"
  | "multi_enum";

export interface ProductImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
}

export interface SeoMeta {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
}

export interface FilterableAttribute {
  key: string;
  label: string;
  dataType: AttributeDataType;
  unit: string | null;
  options: unknown; // JSON array for enum types
}

/** Item shape in product list / featured responses. */
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  brand: string;
  priceAmount: number | null;
  priceCurrency: string | null;
  trendyolUrl: string | null;
  fulfillmentChannel: FulfillmentChannel;
  isFeatured: boolean;
  primaryImage: ProductImage | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** GET /products/:slug */
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  brand: string;
  sku: string | null;
  attributes: Record<string, unknown>;
  trendyolUrl: string | null;
  fulfillmentChannel: FulfillmentChannel;
  priceAmount: number | null;
  priceCurrency: string | null;
  category: { name: string; slug: string } | null;
  images: ProductImage[];
  seo: SeoMeta;
  createdAt: string;
  updatedAt: string;
}

export interface JsonLdProduct {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description?: string;
  sku?: string;
  brand: { "@type": "Brand"; name: string };
  image: string[];
  category?: string;
  offers?: {
    "@type": "Offer";
    price: number;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
}

export interface ProductDetailResponse {
  product: ProductDetail;
  jsonLd: JsonLdProduct;
}

/** GET /categories (tree) */
export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  seo: SeoMeta;
  filterableAttributes: FilterableAttribute[];
  children: CategoryNode[];
}

/** GET /categories/:slug */
export interface CategoryDetailResponse {
  category: Omit<CategoryNode, "children">;
  products: Paginated<ProductListItem>;
}

/** POST /products/:id/click */
export interface ClickResponse {
  trendyolUrl: string | null;
}

/** Standard API error envelope (AllExceptionsFilter). */
export interface ApiErrorBody {
  statusCode: number;
  path: string;
  timestamp: string;
  error: string;
}

/* -------------------------------------------------------------------------- */
/* Admin shapes (auth + dashboard)                                            */
/* -------------------------------------------------------------------------- */

export type AdminRole = "super_admin" | "editor";

/** GET /auth/me · login user (AdminUser minus passwordHash). */
export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /auth/login + /auth/refresh response (the API also Set-Cookies refresh). */
export interface AuthSessionResponse {
  user: AdminUser;
  accessToken: string;
}

/** Decoded access-token JWT payload (signed by the API). */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: AdminRole;
  iat?: number;
  exp?: number;
}

/* --- Catalog (admin CRUD; raw Prisma rows, camelCase fields) --------------- */

export interface AdminProductImage {
  id: string;
  productId: string;
  cloudinaryPublicId: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAttributeDefinition {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  dataType: AttributeDataType;
  unit: string | null;
  options: string[] | null;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** GET /admin/categories/:id — includes attribute defs + immediate children. */
export interface AdminCategoryDetail extends AdminCategory {
  attributes: AdminAttributeDefinition[];
  children: AdminCategory[];
}

/** Prisma Decimal serializes to a string; coerce with Number() for display. */
export interface AdminProduct {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  brand: string;
  sku: string | null;
  status: ProductStatus;
  attributes: Record<string, unknown>;
  trendyolUrl: string | null;
  fulfillmentChannel: FulfillmentChannel;
  isFeatured: boolean;
  featuredSortOrder: number | null;
  priceAmount: string | null;
  priceCurrency: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  createdAt: string;
  updatedAt: string;
  images: AdminProductImage[];
  category?: AdminCategory;
}

/** Payload for POST/PATCH /admin/products (all fields optional on update). */
export interface ProductWritePayload {
  categoryId?: string;
  name?: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  brand?: string;
  sku?: string | null;
  status?: ProductStatus;
  attributes?: Record<string, unknown>;
  trendyolUrl?: string | null;
  fulfillmentChannel?: FulfillmentChannel;
  isFeatured?: boolean;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
}

export interface CategoryWritePayload {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
}

export interface AttributeDefinitionWritePayload {
  key: string;
  label: string;
  dataType: AttributeDataType;
  unit?: string | null;
  options?: string[];
  isRequired?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
}

/** POST /admin/media/sign — short-lived Cloudinary direct-upload params. */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** GET /admin/dashboard */
export interface DashboardSummary {
  totals: {
    products: number;
    publishedProducts: number;
    featuredProducts: number;
    categories: number;
    totalClicks: number;
    clicks7d: number;
    clicks30d: number;
  };
  topProducts: {
    productId: string;
    name: string;
    slug: string;
    totalClicks: number;
    lastClickedAt: string | null;
  }[];
  recentClicks: {
    productId: string;
    name: string;
    slug: string;
    clickedAt: string;
  }[];
}

/* --- Analytics (GET /admin/analytics/clicks) ------------------------------- */

export interface ClickAnalyticsItem {
  productId: string;
  name: string | null;
  slug: string | null;
  isDeleted: boolean;
  clicks: number;
  lastClickedAt: string | null;
}

export interface ClickAnalyticsResponse {
  range: { from: string | null; to: string | null };
  items: ClickAnalyticsItem[];
}

/* --- Admin users (super_admin; /admin/users) ------------------------------- */

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  name: string;
  role?: AdminRole;
}

export interface UpdateAdminUserPayload {
  email?: string;
  password?: string;
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
}

/* --- Audit log (super_admin; GET /admin/audit-logs) ------------------------ */

export interface AuditLog {
  id: string;
  adminUserId: string | null;
  actorEmail: string | null;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  ipHash: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  adminUserId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
