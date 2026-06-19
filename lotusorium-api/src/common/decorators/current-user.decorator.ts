import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '../types/auth-user';

/**
 * Injects the authenticated user (set by JwtAuthGuard).
 * Pass a key to extract a single field, e.g. `@CurrentUser('id')`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
