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
