# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project context

`lotusorium-frontend` is the **Next.js 16 (App Router, React 19) storefront + admin** for Lotusorium — a boutique brand (candles, wooden kitchen decor, candle-making supplies). It is a sibling of `lotusorium-api/` (the NestJS backend) and has its own Vercel project. **Turkish-only** (no i18n), **aggressively mobile-first**, warm-organic-minimalist aesthetic. There is **no on-site checkout** — the "Buy" action records a click and redirects to Trendyol.

The build is feature-complete (storefront + full admin). The plan/phase history lives at `C:\Users\ataon\.claude\plans\act-as-a-senior-synthetic-teapot.md`. Remaining work is real-world Vercel deploy — see `DEPLOY.md`.

## Commands

```bash
npm run dev          # dev server on :3001 (Webpack; predev reaps stray workers)
npm run dev:turbo    # dev with Turbopack (opt-in)
npm run dev:clean    # just reap stray dev workers
npm run build        # next build (Turbopack one-shot) — needs the API on :3000 for SSG
npm run start        # serve the production build on :3001
npm run lint         # eslint
npx tsc --noEmit     # type-check (no test suite in this project)
```

**Windows/dev gotchas:**
- Default `dev` uses `--webpack`; Turbopack is opt-in via `dev:turbo`.
- `dev:clean` only reaps **dev** workers — it does NOT kill a `next start` production server. A lingering prod server holds :3001 (EADDRINUSE). Force-free it: `Get-NetTCPConnection -LocalPort 3001 -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }`.
- `next build` SSG-prerenders storefront pages, so the **NestJS API must be running on :3000** or the build fails with `ECONNREFUSED`.
- Use `127.0.0.1` (not `localhost`) for `API_BASE_URL` in dev — Node's fetch prefers IPv6 `::1`, which fails against an IPv4-bound API.

## Architecture

### The BFF (Backend-for-Frontend) — core decision

The browser **never** calls NestJS directly.
- **Storefront reads** happen in Server Components via `lib/api/server.ts` (`apiServer`) hitting `API_BASE_URL` with `next: { revalidate, tags }`. Typed wrappers live in `lib/api/storefront.ts`. No CORS, no client secrets.
- **Admin reads/writes** go through Next Route Handlers under `app/api/bff/**`. The browser calls same-origin `/api/bff/...`; the handler attaches the access token server-side and forwards to NestJS. Client wrapper: `lib/api/bff-client.ts` (`bffFetch`, `BffAuthError` on 401, `BffError(status,message)`); typed admin fetchers + TanStack Query keys in `lib/api/admin.ts`.

### Session / auth (BFF)

- Two **Next-managed httpOnly cookies**: `lts_at` (access JWT) + `lts_rt` (raw refresh). `Path=/`, `SameSite=Lax`, `Secure` in prod (keys off `NODE_ENV=production`, which Vercel sets). Tokens are **never** exposed to JS (XSS-safe). Constants/helpers in `lib/auth/session.ts`.
- The API's `refresh_token` Set-Cookie (scoped `/api/v1/auth`, `SameSite=strict`) is captured **server-side** (`res.headers.getSetCookie()`) and re-issued as `lts_rt`; replayed to the API as `Cookie: refresh_token=<raw>`. This sidesteps cross-site cookie/CORS friction on Vercel.
- `lib/api/bff-server.ts` (`apiAdmin`, `proxyAdminRequest`) does the Bearer attach + transparent **401 → refresh → retry once** with cookie rotation.
- **GOTCHA: cookie writes only work in Route Handlers.** Never call refresh/`apiAdmin` from an RSC render — `cookies()` is read-only there and throws. The admin layout only *decodes* the token (read-only) for UI gating; real validation happens on the first client BFF call.
- `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`, Node runtime) guards `/yonetim/:path*` with a coarse presence check on `lts_rt`.

### Routing

- Route groups: `app/(storefront)/` (public boutique shell) and `app/(admin)/yonetim/` (admin). Turkish slugs: `urunler`, `kategoriler`, `iletisim`, `yonetim`, `giris`, `kullanicilar`, `kayitlar`, `one-cikanlar`, `analitik`.
- Admin shell split by nested groups: `yonetim/giris` (login, outside guard) vs `yonetim/(dashboard)/*` (guarded shell).
- Dynamic route handlers/pages: `params` and `searchParams` are **Promises** (Next 16) — `await` them. The generic admin proxy is `app/api/bff/admin/[...path]/route.ts` with `params: Promise<{ path: string[] }>`.

### Data & rendering conventions

- **Storefront caching**: `apiServer` calls set `revalidate` + `tags` (e.g. `getCategories` → `revalidate: 300, tags: ["categories"]`). After an API shape change, dev may replay stale cached JSON — clear `.next/cache` or revalidate the tag. ISR/`generateStaticParams` for product/category slugs.
- **Hand-authored API types** in `lib/api/types.ts` are the contract (no shared monorepo types). `Decimal` serializes to **string** (`priceAmount` etc.).
- **Attribute labels**: a product's JSONB `attributes` are mapped to human-readable labels via the category's **`attributeDefinitions`** (ALL defs, ordered by admin `sortOrder`) — NOT `filterableAttributes` (that subset is only for the facet filter). Mapping logic in `lib/attributes.ts` (`buildAttributeRows`); Turkish-aware casing helpers included.
- **Related products ("Benzer Ürünler")**: the product detail page server-fetches same-category products via `getProducts({ category: slug, limit: 13 })`, excludes the current product, caps at 12, and `.catch(() => [])` so a cold/slow API just hides the rail. `components/storefront/related-products.tsx` is a client horizontal slider that **contains its own overflow** (`overflow-x-auto` + `snap-x`), so it can never widen the page; negative margins (`-mx-4 sm:-mx-6`) cancel the `Container` padding for an edge-bleed swipe, cards are `shrink-0` fixed widths, scrollbar hidden, desktop gets prev/next `scrollBy` buttons.
- **Images**: `next/image` + `lib/cloudinary.ts` loader injects `f_auto,q_auto,c_limit,w_…` after `/upload/` in Cloudinary URLs. `ProductImage` falls back to a placeholder on null/error. `next.config.ts` allows `res.cloudinary.com` via `remotePatterns` + `qualities [60,75,90]`. Above-the-fold images get `priority` (homepage hero/first cards, product gallery slide 0, `/kategoriler` first row); below-the-fold do NOT (LCP).
- **Cloudinary upload** (admin): signed direct browser→Cloudinary upload. Shared helper `lib/cloudinary-upload.ts` (`uploadToCloudinary(file, folder?)`) — products use the default `lotusorium/products` folder, categories pass `lotusorium/categories`. Degrades only on a real `BffError.status === 503` (API media signing dormant until `CLOUDINARY_*` is set), never on an env-var guess.

### Admin data layer

TanStack Query over the BFF; `sonner` toasts; `react-hook-form` + `zod` + `@hookform/resolvers`. Notes:
- `z.coerce.number()` breaks RHF resolver typing — keep numeric fields as `z.string()` and `Number()` them in the payload.
- A checkbox bound via RHF `register()` needs a `forwardRef` input (`CheckboxField`) or the ref doesn't attach.
- `Button` has no Radix `Slot`, so `asChild` doesn't work — use `<Link className={buttonVariants(...)}>` for link-buttons.
- Use `useWatch({ control, name })` rather than `watch()` to avoid a React Compiler "incompatible library" warning.
- Super-admin-only sections (`kullanicilar`, `kayitlar`) gate server-side via `lib/auth/claims.ts` (`getAdminClaims`) → `AccessDenied` for editors; the API also enforces 403.

### Styling & brand

- Tailwind v4 design tokens in `app/globals.css` — palette `clay`/`sage`/`cream` + shadcn-compatible semantic tokens (shadcn primitives are themed but shadcn is NOT init'd). Fonts via `next/font`: Fraunces (serif display) + Inter (body), both with `latin-ext` for Turkish glyphs.
- Brand mark: `public/logo.png` (1080² transparent). Header/footer pair it with the wordmark via `next/image` (explicit width/height → no CLS, `alt=""` decorative since the wordmark names the link). Favicon uses the **App Router file convention** — `src/app/icon.png` (64²) + `apple-icon.png` (180²), downsized from the logo with `sharp`; the default `favicon.ico` was removed so the brand mark wins. OG/Twitter images set in `app/layout.tsx` (`metadataBase` makes them absolute).
- Motion: `motion` package (Framer Motion, `motion/react`). `components/storefront/reveal.tsx` is a reduced-motion-aware scroll reveal — applied to below-fold sections only, never the LCP hero. Card tap polish is CSS-only (`active:scale-[0.98] motion-reduce:active:scale-100`).
- Error/loading: per-segment `error.tsx`, root `global-error.tsx` (renders its own `<html>/<body>` with inline styles), `loading.tsx` skeletons.

### Environment

`.env.local` (see `.env.example`): `API_BASE_URL` (server-only, includes `/api/v1`), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. Production values + the required API-side changes (`CORS_ORIGIN`, `PUBLIC_SITE_URL`, `TRUST_PROXY`, rotate secrets) are in `DEPLOY.md`.
