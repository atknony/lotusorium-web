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
