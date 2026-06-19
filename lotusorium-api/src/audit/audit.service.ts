import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditQueryDto } from './dto/audit-query.dto';

export interface AuditEntry {
  adminUserId?: string;
  actorEmail?: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist one audit entry. Never throws into the request path — a failed
   * write is logged and swallowed so it cannot break the mutation it records.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: entry.adminUserId ?? null,
          actorEmail: entry.actorEmail ?? null,
          action: entry.action,
          method: entry.method,
          path: entry.path,
          statusCode: entry.statusCode,
          ipHash: entry.ip
            ? createHash('sha256').update(entry.ip).digest('hex')
            : null,
          userAgent: entry.userAgent ?? null,
          metadata: entry.metadata,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to write audit log for ${entry.action}: ${String(err)}`,
      );
    }
  }

  async list(query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.adminUserId) where.adminUserId = query.adminUserId;
    if (query.action) where.action = { contains: query.action };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
