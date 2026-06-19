import { Prisma } from '@prisma/client';
import {
  buildProductJsonLd,
  toPublicProduct,
  toPublicProductListItem,
} from './product.serializer';

type ProductArg = Parameters<typeof toPublicProduct>[0];

function image(over: Partial<ProductArg['images'][number]> = {}) {
  return {
    id: 'img-1',
    productId: 'p-1',
    cloudinaryPublicId: 'pid',
    url: 'https://cdn.example.com/a.jpg',
    altText: 'A candle',
    width: 800,
    height: 800,
    sortOrder: 0,
    isPrimary: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  };
}

function product(over: Partial<ProductArg> = {}): ProductArg {
  return {
    id: 'p-1',
    categoryId: 'c-1',
    name: 'Lavender Soy Candle',
    slug: 'lavender-soy-candle',
    shortDescription: 'A calming candle',
    description: 'Long description',
    brand: 'Lotusorium',
    sku: 'LSC-1',
    status: 'published',
    attributes: { scent: 'lavender' },
    trendyolUrl: 'https://trendyol.com/p/1',
    fulfillmentChannel: 'trendyol',
    isFeatured: true,
    featuredSortOrder: 1,
    priceAmount: new Prisma.Decimal('199.90'),
    priceCurrency: 'TRY',
    metaTitle: 'Lavender Soy Candle | Lotusorium',
    metaDescription: 'Buy lavender soy candle',
    ogImage: 'https://cdn.example.com/og.jpg',
    canonicalUrl: 'https://shop.example.com/products/lavender-soy-candle',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-02-01T00:00:00Z'),
    deletedAt: null,
    category: {
      id: 'c-1',
      name: 'Candles',
      slug: 'candles',
      description: null,
      parentId: null,
      imageUrl: null,
      sortOrder: 0,
      isActive: true,
      metaTitle: null,
      metaDescription: null,
      ogImage: null,
      canonicalUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    images: [
      image({ id: 'img-1', isPrimary: true, url: 'https://cdn/primary.jpg' }),
      image({ id: 'img-2', url: 'https://cdn/secondary.jpg' }),
    ],
    ...over,
  } as ProductArg;
}

describe('toPublicProductListItem', () => {
  it('picks the primary image, else the first', () => {
    const p = product();
    expect(toPublicProductListItem(p).primaryImage?.url).toBe(
      'https://cdn/primary.jpg',
    );
  });

  it('falls back to the first image when none is primary', () => {
    const p = product({
      images: [image({ isPrimary: false, url: 'https://cdn/first.jpg' })],
    });
    expect(toPublicProductListItem(p).primaryImage?.url).toBe(
      'https://cdn/first.jpg',
    );
  });

  it('returns null primaryImage when there are no images', () => {
    const p = product({ images: [] });
    expect(toPublicProductListItem(p).primaryImage).toBeNull();
  });

  it('coerces the Decimal price to a number', () => {
    expect(toPublicProductListItem(product()).priceAmount).toBe(199.9);
  });
});

describe('toPublicProduct', () => {
  it('exposes SEO fields under `seo` and never leaks deletedAt', () => {
    const result = toPublicProduct(product());
    expect(result.seo).toEqual({
      metaTitle: 'Lavender Soy Candle | Lotusorium',
      metaDescription: 'Buy lavender soy candle',
      ogImage: 'https://cdn.example.com/og.jpg',
      canonicalUrl: 'https://shop.example.com/products/lavender-soy-candle',
    });
    expect(result).not.toHaveProperty('deletedAt');
  });
});

describe('buildProductJsonLd', () => {
  it('produces a schema.org Product with an Offer when priced', () => {
    const jsonLd = buildProductJsonLd(product());
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.brand).toEqual({ '@type': 'Brand', name: 'Lotusorium' });
    expect(jsonLd.offers).toMatchObject({
      '@type': 'Offer',
      price: 199.9,
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
    });
  });

  it('omits offers when the product has no price', () => {
    const jsonLd = buildProductJsonLd(product({ priceAmount: null }));
    expect(jsonLd.offers).toBeUndefined();
  });
});
