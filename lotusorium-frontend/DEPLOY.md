# Deploying the Lotusorium storefront (Vercel)

The frontend is a standard Next.js 16 App Router app. It talks **only** to its
own same-origin BFF (`/api/bff/**`), which forwards server-side to the NestJS
API. The browser never calls the API directly, so there is no cross-origin CORS
surface for the storefront itself — but the API still needs to trust this
domain for cookies/links (see step 4).

## 1. Project setup

- Import `lotusorium-frontend/` as its own Vercel project (root directory =
  `lotusorium-frontend`).
- Framework preset: **Next.js** (auto-detected). Build command `next build`,
  output handled by Vercel. Node 20+.
- The dev-only `predev` worker-reaper and `--webpack` dev flag don't affect the
  production build (`next build` uses Turbopack, one-shot).

## 2. Environment variables (Production scope)

| Variable | Example | Notes |
|---|---|---|
| `API_BASE_URL` | `https://api.lotusorium.com/api/v1` | **Server-only.** Must include `/api/v1`. The BFF calls this. |
| `NEXT_PUBLIC_SITE_URL` | `https://www.lotusorium.com` | Canonical storefront URL — metadata, `sitemap.xml`, OG, JSON-LD. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dzkk3bpnp` | Only used to build responsive `<img>`/`next/image` URLs. |

In production the session cookies (`lts_at`, `lts_rt`) are automatically marked
`Secure` (they key off `NODE_ENV=production`, which Vercel sets). No extra
config needed.

## 2a. Build-time API dependency & cold starts (IMPORTANT)

The storefront pages (`/`, `/kategoriler`, product/category pages) are
**Server Components that fetch the public API at build time** to pre-render
(SSG/ISR). So the Vercel build calls `API_BASE_URL` while building.

If the API is **unreachable or slow during the build**, the affected page hits
Vercel's per-page 60s budget and the whole build fails:

```
Failed to build /(storefront)/page: / ... because it took more than 60 seconds
```

This is common with **Render's free tier**, which sleeps the service after
~15 min of inactivity; the first request then cold-starts for ~50s (it accepts
the TCP connection but doesn't respond, so the fetch *hangs* — `.catch` can't
help a hang).

**Mitigations (both are in place / recommended):**

1. **`apiServer` has a 20s fetch timeout** (`lib/api/server.ts`, `timeoutMs`).
   A cold/slow API now *fails fast* instead of hanging, so the build
   **succeeds** — but those pages prerender with empty/fallback data and only
   fill in on the next ISR revalidation (`revalidate` 60–300s).
2. **To ship a build with real data, warm the API first.** Hit
   `https://<your-api>/api/v1/categories` (or `/health`) and wait for a `200`,
   *then* trigger the Vercel deploy (Redeploy). The build will capture live data.

To avoid cold starts entirely: keep the API warm with an uptime ping
(UptimeRobot / a cron hitting `/health` every ~10 min) or move off the free
tier. On Render, also confirm the service's own env (`DATABASE_URL`,
`JWT_*`, `CORS_ORIGIN`, `CLOUDINARY_*`) is set — see §4.

## 3. Image optimization

`next.config.ts` already allows `res.cloudinary.com` via `remotePatterns`. If you
later serve images from another host, add it there.

## 4. API-side changes (lotusorium-api)

After the storefront domain is known, update the **API's** environment so it
trusts it:

- `CORS_ORIGIN=https://www.lotusorium.com` — the API refuses to boot without it,
  and it gates the refresh-cookie/`Set-Cookie` behavior.
- `PUBLIC_SITE_URL=https://www.lotusorium.com` — base for the API's own
  `sitemap.xml`/`feed.json` absolute URLs (the storefront generates its own
  sitemap too, but keep these consistent).
- `TRUST_PROXY=1` (or the right hop count) so click/audit IP hashing + rate
  limiting see the real client IP behind Vercel/your CDN.
- Rotate the placeholder secrets before going live: `JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET`, and the seeded admin password (`SEED_ADMIN_PASSWORD`).

## 5. Post-deploy smoke test

- `GET /` renders with featured + categories.
- `GET /sitemap.xml` and `GET /robots.txt` resolve; sitemap URLs use the prod
  domain.
- A product page shows JSON-LD (validate in Google's Rich Results Test) and the
  Buy button records a click + opens Trendyol.
- `GET /yonetim` redirects to `/yonetim/giris` when logged out; login works and
  the dashboard loads; logout clears the session.
- Security headers present (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`).
