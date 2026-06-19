import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../audit/audit.service';
import { AuthUser } from '../types/auth-user';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Naive English singularization for resource labels (categories → category). */
function singularize(word: string): string {
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ses')) return word.slice(0, -2); // addresses → address
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

const VERB_BY_METHOD: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

/**
 * Records every successful or failed admin mutation (POST/PUT/PATCH/DELETE by
 * an authenticated user) into the audit log. Reads and public/unauthenticated
 * traffic are ignored. Writing is fire-and-forget — it never blocks or fails
 * the request it observes.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthUser | undefined;

    // Only log authenticated admin mutations.
    if (!user || !MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    const path = req.originalUrl.split('?')[0];
    const action = this.deriveAction(req.method, path);
    const ip = req.ip;
    const userAgent = req.get('user-agent') ?? undefined;
    const params =
      req.params && Object.keys(req.params).length > 0 ? req.params : undefined;

    const write = (statusCode: number) => {
      void this.audit.record({
        adminUserId: user.id,
        actorEmail: user.email,
        action,
        method: req.method,
        path,
        statusCode,
        ip,
        userAgent,
        metadata: params,
      });
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          write(res.statusCode);
        },
        error: (err: unknown) => {
          const statusCode =
            err instanceof HttpException ? err.getStatus() : 500;
          write(statusCode);
        },
      }),
    );
  }

  /** Turn `POST /api/v1/admin/products` into `product.create`, etc. */
  private deriveAction(method: string, path: string): string {
    const verb = VERB_BY_METHOD[method] ?? method.toLowerCase();
    const segments = path.split('/').filter(Boolean);
    const adminIdx = segments.indexOf('admin');
    const after =
      adminIdx >= 0 ? segments.slice(adminIdx + 1) : segments.slice(2); // skip api/v1
    // First non-id segment after the namespace is the resource.
    const resource = after.find((s) => !/^[0-9a-f-]{8,}$/i.test(s)) ?? 'unknown';
    return `${singularize(resource)}.${verb}`;
  }
}
