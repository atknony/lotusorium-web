import { AdminUser } from '@prisma/client';

export type PublicAdminUser = Omit<AdminUser, 'passwordHash'>;

/** Strips the password hash before an admin user leaves the API. */
export function toPublicAdminUser(user: AdminUser): PublicAdminUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
