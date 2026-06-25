import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * In development, `nest start --watch` restarts the process on change and
 * webpack/HMR setups re-evaluate modules in-place. Either way a brand-new
 * `PrismaClient` opens its own pool of up to 17 connections to Postgres
 * (here, the shared Supabase PgBouncer pooler) and the previous client's
 * connections are not always released promptly. After a few reloads the pooler
 * is saturated and the next query fails with:
 *
 *   "Timed out fetching a new connection from the connection pool
 *    (connection limit: 17)"
 *
 * To survive hot-reloads without leaking, we cache the client on `globalThis`
 * and explicitly disconnect any prior instance before adopting the new one.
 * In production each process gets exactly one client, so this is a no-op.
 */
const globalForPrisma = globalThis as unknown as {
  __lotusoriumPrisma?: PrismaService;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['warn', 'error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      // A previous client lingers across a hot-reload — release its pool before
      // this instance opens a new one, so connections never stack up.
      const previous = globalForPrisma.__lotusoriumPrisma;
      if (previous && previous !== this) {
        void previous
          .$disconnect()
          .catch((err) =>
            this.logger.warn(
              `Failed to disconnect stale Prisma client: ${String(err)}`,
            ),
          );
      }
      globalForPrisma.__lotusoriumPrisma = this;
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
