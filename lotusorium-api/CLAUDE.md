# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`lotusorium-api` is the standalone NestJS backend for Lotusorium — a boutique brand selling candles, wooden kitchen decor, and candle-making supplies. It serves a separate Next.js storefront. Today products redirect to Trendyol (no on-site checkout), but the schema and module boundaries are designed to add commerce later without restructuring.

The backend plan document lives at `C:\Users\ataon\.claude\plans\act-as-a-senior-synthetic-teapot.md` and describes the full 8-phase build roadmap. **Phases 1 (Foundation), 2 (Auth + admin users), 3 (Catalog core), 4 (Featured + public read API), 5 (Analytics), 7 (SEO endpoints + audit-log hardening), and 8 (tests) are complete — the backend build is done.** Phase 6 (Blog module) was intentionally skipped — the `BlogPost` model exists in the schema but has no module/endpoints yet.

## Commands

```bash
# Start with hot reload (primary dev command)
npm run start:dev

# One-off build (type-check + compile to dist/)
npm run build

# Lint and auto-fix
npm run lint

# Unit tests  (*.spec.ts files, rootDir: src/)
npm test

# Run a single test file
npx jest src/path/to/file.spec.ts

# Watch mode tests
npm run test:watch

# E2e tests
npm run test:e2e

# Prisma
npx prisma migrate dev --name <migration_name>   # create + apply migration
npx prisma migrate status                        # check pending migrations
npx prisma generate                              # regenerate client after schema change
npx prisma studio                                # browser GUI for the database
npm run prisma:seed                              # seed/ensure the super_admin (idempotent)
```

Local Postgres runs in Docker:
```bash
docker compose up -d     # start
docker compose down      # stop (data persists in lotusorium_pgdata volume)
```

## Architecture

### Request lifecycle

```
HTTP → helmet/cookieParser → ThrottlerGuard (100 req/min/IP, global)
     → JwtAuthGuard (global; skipped on @Public() routes)
     → RolesGuard (global; enforces @Roles() metadata)
     → ValidationPipe (whitelist + transform, global)
     → Controller → Service → PrismaService
     → AllExceptionsFilter (shapes every error response)
```

The three guards are registered as `APP_GUARD` in `app.module.ts` **in this order** (throttle → authenticate → authorize). All routes are authenticated by default; opt out with `@Public()`.

### URL structure

- `GET /health` — no prefix, `VERSION_NEUTRAL` (bypasses URI versioning), `@Public()`
- Everything else: `/api/v1/...` — global prefix `api`, URI versioning with `defaultVersion: '1'`
- Convention: public/storefront routes are plain (e.g. `/api/v1/products`); admin-only routes are namespaced under `admin/` (e.g. `/api/v1/admin/users`) and guarded with `@Roles()`.

### Module layout

Feature modules are **top-level directories under `src/`** (not nested in a `modules/` folder). Each is the standard NestJS module → controller → service, with a `dto/` subfolder for request DTOs.

```
src/
  config/           # configuration.ts (typed factory) + env.validation.ts (Joi schema)
  prisma/           # PrismaModule (@Global) + PrismaService
  common/
    filters/        # AllExceptionsFilter — all errors go through here
    guards/         # JwtAuthGuard, RolesGuard (both global via APP_GUARD)
    decorators/     # @Public(), @Roles(), @CurrentUser()
    serializers/    # toPublicAdminUser() — strips passwordHash
    types/          # auth-user.ts + express.d.ts (augments Request.user)
  health/           # GET /health → adminUser.count() ping
  auth/             # login/refresh/logout/me + TokensService
  admin-users/      # super_admin-only CRUD for admin accounts
  categories/       # category CRUD (soft-delete, self-referential parent)
  attributes/       # attribute_definition CRUD, nested under a category
  products/         # product CRUD + DynamicAttributeValidator
  media/            # Cloudinary signing + ProductImage CRUD/reorder
  featured/         # admin GET/PUT ordered featured-product set
  public/           # @Public() storefront read API (products/categories/featured)
  analytics/        # public click tracking + admin dashboard/analytics
  seo/              # @Public() sitemap.xml + product feed.json for crawlers/GEO
  audit/            # AuditService + global AuditLogInterceptor + admin read API
```

The `AuditLogInterceptor` lives in `common/interceptors/` but is registered as
`APP_INTERCEPTOR` **inside `AuditModule`** (not `app.module.ts`) so it can inject
`AuditService` from the same module.

`PrismaModule` is `@Global()` — inject `PrismaService` directly in any module without re-importing `PrismaModule`. Same for `ConfigModule` and `JwtModule` (both global).

### Authentication & authorization

- **Access token**: JWT (`Bearer` header), short TTL. Signed/verified with `JWT_ACCESS_SECRET`; payload `{ sub, email, role }`. `JwtAuthGuard` validates it and populates `request.user`.
- **Refresh token**: opaque random string in an **httpOnly, SameSite=strict cookie** scoped to `/api/v1/auth`. Stored only as a SHA-256 hash in `refresh_token`. `TokensService` (in `auth/`) handles **rotation with family-based reuse detection**: presenting an already-rotated token revokes the entire token family.
- **Passwords**: argon2 hashing. Login verifies against a dummy hash even for unknown/inactive users to keep response timing uniform. **Never return `AdminUser` directly** — pass it through `toPublicAdminUser()` to strip `passwordHash`.
- **RBAC**: `@Roles(AdminRole.super_admin)` at controller or method level; enforced by `RolesGuard`. Use `@CurrentUser()` / `@CurrentUser('id')` to read the authenticated user in handlers.

### Catalog conventions (Phase 3)

- **Slugs**: generated via `slugify()` in `common/utils/slug.util.ts` (Turkish-aware: `ü→u`, `ş→s`, etc.). `ensureUniqueSlug()` appends `-2`, `-3`… on collision. Slugs are **stable**: they are NOT regenerated when `name` changes — only when an explicit `slug` is supplied.
- **Soft delete**: categories and products set `deletedAt` instead of deleting. All reads filter `deletedAt: null`. Products have a `POST /:id/restore` endpoint.
- **Dynamic attribute validation**: `DynamicAttributeValidator` (`products/`) runs on every product create/update in **strict mode** — rejects unknown keys, enforces required attributes, type-checks values, and validates enum/multi_enum against the definition's `options`. It returns a normalized object persisted to `product.attributes` (JSONB). Re-runs on update whenever `attributes` OR `categoryId` changes.
- **Images / Cloudinary**: `CloudinaryService` is **dormant until `CLOUDINARY_*` env vars are set** — every method throws 503 otherwise. Upload flow is browser→Cloudinary direct using `POST /admin/media/sign`; the backend then persists metadata via `POST /admin/products/:id/images`. Exactly one image per product is `isPrimary` (enforced in a transaction); the first image added becomes primary automatically. Deleting an image removes the Cloudinary asset *before* the DB row so a failed delete can be retried rather than orphaning the asset.
- Catalog endpoints are under `admin/` and require auth but **not** a specific role (any authenticated admin — `super_admin` or `editor` — can manage the catalog). Only `admin-users` is `super_admin`-only.

### Public read API conventions (Phase 4)

- All `public/` controllers are `@Public()` (no auth), still throttled, and set `Cache-Control` via `PUBLIC_CACHE_CONTROL` (`public-cache.ts`); Express adds ETags automatically.
- **Visibility**: public endpoints expose only `status: published` products and `isActive` categories (both `deletedAt: null`). Requesting a draft/missing slug → 404.
- **Shapes**: responses go through `common/serializers/` — `toPublicProductListItem` (cards), `toPublicProduct` (detail), `toPublicCategory` (with `filterableAttributes`). Never return raw Prisma rows publicly.
- **JSON-LD**: `GET /products/:slug` returns `{ product, jsonLd }` where `jsonLd` is schema.org `Product` built by `buildProductJsonLd()` — for the Next.js layer to inject for SEO/GEO.
- **Faceted filtering**: `GET /products?attr[key]=value` filters on the `attributes` JSONB via Prisma `path`/`equals`. Values are auto-coerced (boolean/number/string). **This relies on the Express `extended` query parser**, set in `main.ts` (`app.set('query parser', 'extended')`) — Express 5 defaults to `'simple'`, which does NOT parse bracket notation into nested objects. multi_enum faceting is not yet supported.
- **Pagination**: list endpoints return `{ data, meta: { total, page, limit, totalPages } }`; default limit 20, max 100.

### Analytics conventions (Phase 5)

- **Click tracking**: `POST /products/:id/click` is `@Public()` and carries a stricter `@Throttle({ default: { limit: 30, ttl: 60000 } })` than the global 100/min. It records an append-only `redirect_click` row (referrer + user-agent from headers, **IP stored only as a SHA-256 hash**, optional `sessionId`) and increments the `product_click_stats` rollup (`totalClicks`, `lastClickedAt`) in one transaction, then returns `{ trendyolUrl }`. Only `published` products are clickable (else 404).
- **Source of truth vs rollup**: `redirect_click` is the event log; `product_click_stats` holds fast all-time counters. Rolling windows (7d/30d) are computed **live** from the event log in the dashboard for accuracy; `refreshRollups()` (admin `POST /admin/analytics/refresh`, also a future cron hook) backfills the `clicks7d`/`clicks30d` columns.
- **Admin endpoints**: `GET /admin/dashboard` (totals + top products + recent clicks), `GET /admin/analytics/clicks?from&to` (per-product counts via Prisma `groupBy`, date-range filterable).

### SEO & audit conventions (Phase 7)

- **Crawler endpoints** (`seo/`, both `@Public()` + cached): `GET /api/v1/seo/sitemap.xml` returns a standards-compliant `urlset` (home + active categories + published products + published blog posts; drafts/inactive/deleted excluded) with `Content-Type: application/xml`; `GET /api/v1/seo/feed.json` returns a structured product feed (schema.org facts) for AI/GEO crawlers. **URLs are absolute and point at the storefront** (`publicSiteUrl`), not the API.
- **`PUBLIC_SITE_URL`** config (defaults to `CORS_ORIGIN`) is the base for all sitemap/feed URLs. `SeoService` strips a trailing slash and prefixes paths like `/products/:slug`. XML values are escaped via a local `escapeXml`.
- **Audit log**: a global `AuditLogInterceptor` records every **authenticated admin mutation** (`POST/PUT/PATCH/DELETE` with a `request.user`) — reads and public traffic are skipped. It captures actor id+email, derived `action` (e.g. `category.create`, via `method`→verb + singularized resource segment), method, path, resulting status code (**logs failures too** — the error branch reads `HttpException.getStatus()`), **IP stored only as a SHA-256 hash**, user-agent, and route params as `metadata`. Writes are **fire-and-forget**: `AuditService.record()` swallows its own errors so logging can never break or block the mutation.
- **`audit_log` has no FK to `admin_user`** — the actor's id+email are snapshotted as plain columns so the row survives the actor's deletion.
- **Read API**: `GET /api/v1/admin/audit-logs` is **`super_admin`-only**, paginated (`{ data, meta }`), filterable by `adminUserId`, `action` (substring), and `from`/`to` (ISO-8601 on `createdAt`).
- **`TRUST_PROXY`** config (default `0`): when `>0`, `main.ts` calls `app.set('trust proxy', N)` so `req.ip` (used for click + audit IP hashing and rate limiting) reflects the real client behind a CDN/load balancer. Set it in production.

### Testing conventions (Phase 8)

- **ts-jest must emit CommonJS.** The project's base `tsconfig.json` is `module: nodenext`, which ts-jest would turn into ESM that Jest can't run. Both jest configs (the `jest` block in `package.json` and `test/jest-e2e.json`) override the transform with `tsconfig: { module: commonjs, moduleResolution: node, resolvePackageJsonExports: false }`. The `resolvePackageJsonExports: false` is required — leaving it inherited from the base config triggers `TS5098` against the `node` moduleResolution. Mirrors the existing ts-node override used for the seed.
- **Unit specs** (`*.spec.ts`, `rootDir: src`) are pure and DB-free — they construct classes directly and mock `PrismaService`/`ConfigService`/`AuditService` with plain objects or `jest.fn()`. Covered: `DynamicAttributeValidator`, `slug.util`, product serializer + JSON-LD, `AuditLogInterceptor` (via a fake `ExecutionContext`), `SeoService`.
- **E2e** (`test/*.e2e-spec.ts`) boots the real `AppModule` and **must replicate `main.ts`'s global setup** (cookieParser, `setGlobalPrefix('api')`, URI versioning v1, the global `ValidationPipe`) — `Test.createNestApplication()` does NOT apply `main.ts`. It requires **Postgres up (`docker compose up -d`) and a seeded super_admin**; it logs in with `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`. Every row it creates (category, attribute def, product, editor user, and the audit-log rows generated) is **hard-deleted in `afterAll`** so the dev DB stays clean.

### Database design decisions

**Dynamic product attributes** use a hybrid model: `attribute_definition` rows (per category, admin-created, typed) define the schema; `product.attributes` (JSONB) stores values. Validation against definitions happens in the service layer, not the DB. Adding a new attribute like "scent" is an INSERT, never a migration.

**Trendyol click analytics** are append-only events in `redirect_click` + a `product_click_stats` rollup for fast dashboard reads.

**Future e-commerce** is reserved in schema comments at the bottom of `schema.prisma`. `product` already has `price_amount`, `price_currency`, and `fulfillment_channel` columns so the catalog table never needs restructuring.

### Key constraints

- **Prisma 5.22** — do NOT upgrade to Prisma 7. Prisma 7 removed URL-based client connections and its new ESM-only generator is incompatible with NestJS's CommonJS runtime.
- **Error response shape** (enforced by `AllExceptionsFilter`): `{ statusCode, path, timestamp, error }`.
- **Config validation** (Joi) runs at startup. The server refuses to boot if `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, or `CORS_ORIGIN` are missing or wrong. See `src/config/env.validation.ts`.
- **Swagger** is mounted at `/docs` in non-production environments only. Tag controllers with `@ApiTags()` and add `@ApiBearerAuth()` to guarded ones.
- **`isolatedModules` + `emitDecoratorMetadata`**: any type used only in a decorated signature (e.g. Express `Request`/`Response` in a `@Req()`/`@Res()` param) must be imported with `import type { ... }`, or `nest build` fails with TS1272.
- **ts-node CommonJS override**: the seed runs via `ts-node` under a `"ts-node": { "compilerOptions": { "module": "commonjs" } }` block in `tsconfig.json`, because the project's default module mode is `nodenext`.
