import { PrismaClient, AdminRole } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@lotusorium.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const name = process.env.SEED_ADMIN_NAME ?? 'Lotusorium Admin';

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    return;
  }

  await prisma.adminUser.create({
    data: {
      email,
      name,
      role: AdminRole.super_admin,
      passwordHash: await argon2.hash(password),
    },
  });
  console.log(`Created super admin: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
