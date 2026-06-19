import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminUser } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Manages JWT access tokens and opaque, DB-backed refresh tokens.
 *
 * Refresh tokens are high-entropy random strings stored only as SHA-256
 * hashes. Each login starts a token "family"; rotation issues a new token in
 * the same family and revokes the old one. Presenting an already-revoked token
 * (reuse) revokes the entire family — the standard theft-detection pattern.
 */
@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  signAccessToken(user: Pick<AdminUser, 'id' | 'email' | 'role'>): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<number>('jwt.accessTtl'),
      },
    );
  }

  /** Creates a new refresh token. Omit `familyId` to start a fresh family. */
  async issueRefreshToken(adminUserId: string, familyId?: string): Promise<string> {
    const raw = randomBytes(48).toString('hex');
    const ttl = this.config.get<number>('jwt.refreshTtl') ?? 2592000;
    await this.prisma.refreshToken.create({
      data: {
        adminUserId,
        tokenHash: this.hash(raw),
        familyId: familyId ?? randomUUID(),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    return raw;
  }

  /** Validates + rotates a refresh token, returning the user and a new token. */
  async rotateRefreshToken(
    rawToken: string,
  ): Promise<{ adminUser: AdminUser; refreshToken: string }> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
      include: { adminUser: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt) {
      // Reuse of a revoked token => likely theft. Burn the whole family.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: existing.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!existing.adminUser.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const refreshToken = await this.issueRefreshToken(
      existing.adminUserId,
      existing.familyId,
    );
    return { adminUser: existing.adminUser, refreshToken };
  }

  async revokeToken(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(adminUserId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
