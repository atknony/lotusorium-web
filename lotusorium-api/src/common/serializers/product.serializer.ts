import { Prisma, ProductImage } from '@prisma/client';

type ProductWithImages = Prisma.ProductGetPayload<{
  include: { images: true };
}>;
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { images: true; category: true };
}>;

function toMoney(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

function mapImage(img: ProductImage) {
  return {
    url: img.url,
    altText: img.altText,
    width: img.width,
    height: img.height,
    isPrimary: img.isPrimary,
  };
}

/** Compact shape for product listings / cards. */
export function toPublicProductListItem(product: ProductWithImages) {
  const primary =
    product.images.find((i) => i.isPrimary) ?? product.images[0] ?? null;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    brand: product.brand,
    priceAmount: toMoney(product.priceAmount),
    priceCurrency: product.priceCurrency,
    trendyolUrl: product.trendyolUrl,
    fulfillmentChannel: product.fulfillmentChannel,
    isFeatured: product.isFeatured,
    primaryImage: primary ? mapImage(primary) : null,
  };
}

/** Full public detail shape (single product page). */
export function toPublicProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    brand: product.brand,
    sku: product.sku,
    attributes: product.attributes,
    trendyolUrl: product.trendyolUrl,
    fulfillmentChannel: product.fulfillmentChannel,
    priceAmount: toMoney(product.priceAmount),
    priceCurrency: product.priceCurrency,
    category: product.category
      ? { name: product.category.name, slug: product.category.slug }
      : null,
    images: product.images.map(mapImage),
    seo: {
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      ogImage: product.ogImage,
      canonicalUrl: product.canonicalUrl,
    },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/** schema.org Product structured data for SEO / Generative Engine Optimization. */
export function buildProductJsonLd(
  product: ProductWithRelations,
): Record<string, unknown> {
  const images = product.images.map((i) => i.url);
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.sku ?? undefined,
    brand: { '@type': 'Brand', name: product.brand },
    image: images.length > 0 ? images : undefined,
    category: product.category?.name,
  };

  const price = toMoney(product.priceAmount);
  if (price !== null) {
    jsonLd.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: product.priceCurrency ?? 'TRY',
      availability: 'https://schema.org/InStock',
      url: product.trendyolUrl ?? undefined,
    };
  }

  return jsonLd;
}
