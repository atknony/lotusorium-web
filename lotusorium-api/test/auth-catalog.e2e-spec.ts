import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * End-to-end coverage of the security boundary + catalog write path:
 *  - admin routes reject anonymous access (401) and wrong-role access (403)
 *  - login → create category → add attribute def → create product
 *  - the DynamicAttributeValidator rejects bad payloads and accepts valid ones
 *  - a published product surfaces on the public API
 *
 * Requires Postgres (docker compose up) and a seeded super_admin. All rows
 * created here are hard-deleted in afterAll.
 */
describe('Auth + Catalog (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const tag = Date.now();
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@lotusorium.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const editorEmail = `e2e-editor-${tag}@test.local`;
  const editorPassword = 'EditorPass123!';
  const testStart = new Date();

  let accessToken: string;
  let editorToken: string;
  let categoryId: string;
  let productId: string;
  let productSlug: string;
  let editorId: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    // Clean up everything this run created, in FK-safe order.
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    if (categoryId) {
      // attribute_definition cascades on category delete
      await prisma.category.deleteMany({ where: { id: categoryId } });
    }
    if (editorId) {
      await prisma.adminUser.deleteMany({ where: { id: editorId } });
    }
    await prisma.auditLog.deleteMany({
      where: { createdAt: { gte: testStart } },
    });
    await app.close();
  });

  describe('auth boundary', () => {
    it('rejects an anonymous admin request with 401', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/products')
        .expect(401);
    });

    it('issues an access token on valid login', () => {
      expect(typeof accessToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(20);
    });

    it('rejects bad credentials with 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: 'wrong-password' })
        .expect(401);
    });
  });

  describe('catalog write path', () => {
    it('creates a category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/categories')
        .set(auth(accessToken))
        .send({ name: `E2E Candles ${tag}` })
        .expect(201);
      categoryId = res.body.id;
      expect(res.body.slug).toContain('e2e-candles');
    });

    it('adds a required enum attribute definition to the category', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/categories/${categoryId}/attributes`)
        .set(auth(accessToken))
        .send({
          key: 'scent',
          label: 'Scent',
          dataType: 'enum',
          options: ['lavender', 'vanilla'],
          isRequired: true,
          isFilterable: true,
        })
        .expect(201);
    });

    it('rejects a product whose required attribute is missing (400)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set(auth(accessToken))
        .send({ categoryId, name: `E2E NoAttr ${tag}`, attributes: {} })
        .expect(400);
    });

    it('rejects a product with an enum value outside the options (400)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set(auth(accessToken))
        .send({
          categoryId,
          name: `E2E BadEnum ${tag}`,
          attributes: { scent: 'sandalwood' },
        })
        .expect(400);
    });

    it('rejects a product with an unknown attribute key (400)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set(auth(accessToken))
        .send({
          categoryId,
          name: `E2E Unknown ${tag}`,
          attributes: { scent: 'lavender', color: 'red' },
        })
        .expect(400);
    });

    it('creates a published product with a valid attribute payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set(auth(accessToken))
        .send({
          categoryId,
          name: `E2E Lavender Candle ${tag}`,
          status: 'published',
          attributes: { scent: 'lavender' },
          trendyolUrl: 'https://www.trendyol.com/p/123',
          priceAmount: 199.9,
          priceCurrency: 'TRY',
        })
        .expect(201);
      productId = res.body.id;
      productSlug = res.body.slug;
      expect(res.body.attributes).toEqual({ scent: 'lavender' });
    });
  });

  describe('public surface', () => {
    it('exposes the published product by slug with JSON-LD', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/products/${productSlug}`)
        .expect(200);
      expect(res.body.product.slug).toBe(productSlug);
      expect(res.body.jsonLd['@type']).toBe('Product');
      expect(res.body.jsonLd.offers.priceCurrency).toBe('TRY');
    });

    it('returns 404 for an unknown product slug', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/does-not-exist-${tag}`)
        .expect(404);
    });
  });

  describe('RBAC (super_admin-only routes)', () => {
    it('creates an editor and reuses it to prove 403 on a privileged route', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set(auth(accessToken))
        .send({
          email: editorEmail,
          password: editorPassword,
          name: 'E2E Editor',
          role: 'editor',
        })
        .expect(201);
      editorId = created.body.id;

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: editorEmail, password: editorPassword })
        .expect(200);
      editorToken = login.body.accessToken;

      // Editor may manage the catalog...
      await request(app.getHttpServer())
        .get('/api/v1/admin/products')
        .set(auth(editorToken))
        .expect(200);

      // ...but not super_admin-only audit logs.
      await request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .set(auth(editorToken))
        .expect(403);
    });
  });
});
