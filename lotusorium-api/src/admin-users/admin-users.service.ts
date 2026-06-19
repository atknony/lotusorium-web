import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicAdminUser } from '../common/serializers/admin-user.serializer';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdminUserDto) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const user = await this.prisma.adminUser.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role ?? 'editor',
        passwordHash: await argon2.hash(dto.password),
      },
    });
    return toPublicAdminUser(user);
  }

  async findAll() {
    const users = await this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(toPublicAdminUser);
  }

  async findOne(id: string) {
    return toPublicAdminUser(await this.ensureExists(id));
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    await this.ensureExists(id);

    if (dto.email) {
      const clash = await this.prisma.adminUser.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (clash) {
        throw new ConflictException('Email already in use');
      }
    }

    const data: Prisma.AdminUserUpdateInput = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) data.passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.adminUser.update({ where: { id }, data });
    return toPublicAdminUser(user);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.adminUser.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found');
    }
    return user;
  }
}
