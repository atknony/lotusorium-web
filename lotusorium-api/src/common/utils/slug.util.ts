const TURKISH_MAP: Record<string, string> = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
};

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Converts a (possibly Turkish) string into a URL-safe slug. */
export function slugify(input: string): string {
  const transliterated = input
    .split('')
    .map((ch) => TURKISH_MAP[ch] ?? ch)
    .join('');

  return transliterated
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '') // strip remaining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns a slug guaranteed unique against `exists`, appending -2, -3, ...
 * on collision. `exists` should ignore the record being updated (if any).
 */
export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = base || 'item';
  let candidate = root;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
