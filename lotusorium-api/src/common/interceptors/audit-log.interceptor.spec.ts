import { CallHandler, ExecutionContext, NotFoundException } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { AuditService } from '../../audit/audit.service';

type FakeReq = {
  method: string;
  originalUrl: string;
  user?: { id: string; email: string; role: string };
  ip?: string;
  params?: Record<string, string>;
};

function makeContext(req: FakeReq, statusCode = 200): ExecutionContext {
  const fullReq = {
    ...req,
    get: (h: string) => (h === 'user-agent' ? 'jest-UA' : undefined),
  };
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => fullReq,
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

function okHandler(): CallHandler {
  return { handle: () => of({ ok: true }) };
}

const admin = { id: 'u1', email: 'admin@lotusorium.com', role: 'super_admin' };

describe('AuditLogInterceptor', () => {
  let audit: { record: jest.Mock };
  let interceptor: AuditLogInterceptor;

  beforeEach(() => {
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    interceptor = new AuditLogInterceptor(audit as unknown as AuditService);
  });

  it('logs an authenticated POST mutation with a derived action', async () => {
    const ctx = makeContext(
      {
        method: 'POST',
        originalUrl: '/api/v1/admin/categories?x=1',
        user: admin,
        ip: '1.2.3.4',
        params: {},
      },
      201,
    );
    await lastValueFrom(interceptor.intercept(ctx, okHandler()));

    expect(audit.record).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'category.create',
        method: 'POST',
        path: '/api/v1/admin/categories',
        statusCode: 201,
        adminUserId: 'u1',
        actorEmail: 'admin@lotusorium.com',
        ip: '1.2.3.4',
        userAgent: 'jest-UA',
      }),
    );
  });

  it('singularizes the resource for a DELETE on a sub-resource id', async () => {
    const ctx = makeContext(
      {
        method: 'DELETE',
        originalUrl:
          '/api/v1/admin/products/3f2504e0-4f89-41d3-9a0c-0305e82c3301',
        user: admin,
        params: { id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301' },
      },
      200,
    );
    await lastValueFrom(interceptor.intercept(ctx, okHandler()));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'product.delete' }),
    );
  });

  it('does NOT log GET (read) requests', async () => {
    const ctx = makeContext({
      method: 'GET',
      originalUrl: '/api/v1/admin/products',
      user: admin,
    });
    await lastValueFrom(interceptor.intercept(ctx, okHandler()));
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('does NOT log unauthenticated mutations', async () => {
    const ctx = makeContext({
      method: 'POST',
      originalUrl: '/api/v1/products/abc/click',
    });
    await lastValueFrom(interceptor.intercept(ctx, okHandler()));
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('logs failures with the HttpException status code', async () => {
    const ctx = makeContext({
      method: 'PATCH',
      originalUrl: '/api/v1/admin/categories/abc',
      user: admin,
      params: { id: 'abc' },
    });
    const failing: CallHandler = {
      handle: () => throwError(() => new NotFoundException()),
    };

    await expect(
      lastValueFrom(interceptor.intercept(ctx, failing)),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'category.update', statusCode: 404 }),
    );
  });
});
