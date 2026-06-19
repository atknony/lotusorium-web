import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { toPublicAdminUser } from '../common/serializers/admin-user.serializer';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string): void {
    const ttl = this.config.get<number>('jwt.refreshTtl') ?? 2592000;
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get<string>('nodeEnv') === 'production',
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      maxAge: ttl * 1000,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.login(
      dto.email,
      dto.password,
    );
    this.setRefreshCookie(res, refreshToken);
    return { user: toPublicAdminUser(user), accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const { user, accessToken, refreshToken } = await this.auth.refresh(raw);
    this.setRefreshCookie(res, refreshToken);
    return { user: toPublicAdminUser(user), accessToken };
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.auth.logout(raw);
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    return { success: true };
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    const user = await this.auth.me(userId);
    return user ? toPublicAdminUser(user) : null;
  }
}
