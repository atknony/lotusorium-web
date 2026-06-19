/**
 * Cache-Control for public read endpoints. Short browser TTL, longer CDN TTL,
 * and stale-while-revalidate so the storefront/CDN stays fast. Express adds
 * ETags automatically for conditional requests.
 */
export const PUBLIC_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600';
