import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { CategoriesModule } from './categories/categories.module';
import { AttributesModule } from './attributes/attributes.module';
import { ProductsModule } from './products/products.module';
import { MediaModule } from './media/media.module';
import { FeaturedModule } from './featured/featured.module';
import { PublicModule } from './public/public.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SeoModule } from './seo/seo.module';
import { AuditModule } from './audit/audit.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminUsersModule,
    CategoriesModule,
    AttributesModule,
    ProductsModule,
    MediaModule,
    FeaturedModule,
    PublicModule,
    AnalyticsModule,
    SeoModule,
    AuditModule,
    // Future: BlogModule
  ],
  providers: [
    // Guard order matters: throttle -> authenticate -> authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
