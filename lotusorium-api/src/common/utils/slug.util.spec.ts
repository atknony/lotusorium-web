import { ensureUniqueSlug, slugify } from './slug.util';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Lavender Soy Candle')).toBe('lavender-soy-candle');
  });

  it('transliterates Turkish characters', () => {
    expect(slugify('Mumlar & Kokulu Ürünler')).toBe('mumlar-kokulu-urunler');
    expect(slugify('Çiçek Şişe Güneş')).toBe('cicek-sise-gunes');
    expect(slugify('İstanbul')).toBe('istanbul');
  });

  it('strips leading/trailing separators and collapses runs', () => {
    expect(slugify('  --Hello---World!!  ')).toBe('hello-world');
  });

  it('removes diacritics from non-Turkish accents', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme');
  });

  it('returns an empty string for input with no alphanumerics', () => {
    expect(slugify('!!! ___ ???')).toBe('');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns the base when it is free', async () => {
    const result = await ensureUniqueSlug('candle', async () => false);
    expect(result).toBe('candle');
  });

  it('appends -2, -3 ... until a free slug is found', async () => {
    const taken = new Set(['candle', 'candle-2', 'candle-3']);
    const result = await ensureUniqueSlug('candle', async (s) => taken.has(s));
    expect(result).toBe('candle-4');
  });

  it('falls back to "item" when the base is empty', async () => {
    const result = await ensureUniqueSlug('', async () => false);
    expect(result).toBe('item');
  });
});
