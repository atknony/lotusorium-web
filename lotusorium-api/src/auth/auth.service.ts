import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminUser } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from './tokens.service';

interface AuthResult {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
  ) {}

  private async validateCredentials(
    email: string,
    password: string,
  ): Promise<AdminUser> {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    // Verify against a hash even when the user is missing/inactive to keep the
    // response time uniform and avoid leaking which emails exist.
    const hash =
      user?.passwordHash ??
      '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const passwordValid = await argon2.verify(hash, password).catch(() => false);

    if (!user || !user.isActive || !passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.validateCredentials(email, password);
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const accessToken = await this.tokens.signAccessToken(user);
    const refreshToken = await this.tokens.issueRefreshToken(user.id);
    return { user, accessToken, refreshToken };
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const { adminUser, refreshToken } =
      await this.tokens.rotateRefreshToken(rawRefreshToken);
    const accessToken = await this.tokens.signAccessToken(adminUser);
    return { user: adminUser, accessToken, refreshToken };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) {
      await this.tokens.revokeToken(rawRefreshToken);
    }
  }

  me(userId: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({ where: { id: userId } });
  }
}
