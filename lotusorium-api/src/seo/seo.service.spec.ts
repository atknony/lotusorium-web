import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SeoService } from './seo.service';

function buildService(over: {
  products?: unknown[];
  categories?: unknown[];
  posts?: unknown[];
  siteUrl?: string;
}) {
  const prisma = {
    product: { findMany: jest.fn().mockResolvedValue(over.products ?? []) },
    category: { findMany: jest.fn().mockResolvedValue(over.categories ?? []) },
    blogPost: { findMany: jest.fn().mockResolvedValue(over.posts ?? []) },
  } as unknown as PrismaService;

  const config = {
    get: jest.fn().mockReturnValue(over.siteUrl ?? 'https://shop.example.com'),
  } as unknown as ConfigService;

  return new SeoService(prisma, config);
}

const now = new Date('2026-03-01T12:00:00Z');

describe('SeoService.buildSitemapXml', () => {
  it('always includes the homepage as the first entry', async () => {
    const xml = await buildService({}).buildSitemapXml();
    expect(xml.startsWith('<?xml')).toBe(true);
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>https://shop.example.com/</loc>');
  });

  it('emits absolute storefront URLs for products and categories', async () => {
    const xml = await buildService({
      categories: [{ slug: 'candles', updatedAt: now }],
      products: [{ slug: 'lavender-soy-candle', updatedAt: now }],
    }).buildSitemapXml();

    expect(xml).toContain(
      '<loc>https://shop.example.com/categories/candles</loc>',
    );
    expect(xml).toContain(
      '<loc>https://shop.example.com/products/lavender-soy-candle</loc>',
    );
    expect(xml).toContain(`<lastmod>${now.toISOString()}</lastmod>`);
  });

  it('strips a trailing slash from the configured site URL', async () => {
    const xml = await buildService({
      siteUrl: 'https://shop.example.com/',
      products: [{ slug: 'p1', updatedAt: now }],
    }).buildSitemapXml();
    expect(xml).toContain('<loc>https://shop.example.com/products/p1</loc>');
    expect(xml).not.toContain('shop.example.com//');
  });

  it('XML-escapes special characters in URLs', async () => {
    const xml = await buildService({
      products: [{ slug: 'tom&jerry', updatedAt: now }],
    }).buildSitemapXml();
    expect(xml).toContain('tom&amp;jerry');
    expect(xml).not.toContain('tom&jerry');
  });
});

describe('SeoService.buildProductFeed', () => {
  it('shapes published products with absolute URLs and primary image', async () => {
    const feed = await buildService({
      products: [
        {
          id: 'p-1',
          name: 'Lavender Soy Candle',
          slug: 'lavender-soy-candle',
          shortDescription: 'calming',
          description: 'long',
          brand: 'Lotusorium',
          sku: 'LSC-1',
          priceAmount: 199.9,
          priceCurrency: 'TRY',
          trendyolUrl: 'https://trendyol.com/p/1',
          attributes: { scent: 'lavender' },
          updatedAt: now,
          category: { name: 'Candles', slug: 'candles' },
          images: [
            { url: 'https://cdn/secondary.jpg', isPrimary: false, sortOrder: 1 },
            { url: 'https://cdn/primary.jpg', isPrimary: true, sortOrder: 0 },
          ],
        },
      ],
    }).buildProductFeed();

    expect(feed.count).toBe(1);
    expect(feed.site).toBe('https://shop.example.com');
    const item = feed.products[0];
    expect(item.url).toBe('https://shop.example.com/products/lavender-soy-candle');
    expect(item.image).toBe('https://cdn/primary.jpg');
    expect(item.price).toBe(199.9);
    expect(item.availability).toBe('https://schema.org/InStock');
  });

  it('returns an empty feed when there are no published products', async () => {
    const feed = await buildService({}).buildProductFeed();
    expect(feed.count).toBe(0);
    expect(feed.products).toEqual([]);
  });
});
