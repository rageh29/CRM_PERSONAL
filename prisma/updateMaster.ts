import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  // Update all existing admin users to be Master Admin
  await prisma.user.updateMany({
    data: {
      isMasterAdmin: true,
      role: 'MASTER_ADMIN',
    },
  });

  const existingErrorAdmin = await prisma.user.findUnique({
    where: { email: 'admin@error.com' },
  });

  if (!existingErrorAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'المالك الرئيسي للنظام',
        email: 'admin@error.com',
        password: hashedPassword,
        role: 'MASTER_ADMIN',
        isMasterAdmin: true,
        permissions: '["ALL"]',
      },
    });
  }

  console.log('MASTER ADMIN UPDATED SUCCESSFULLY');
}

main().catch(console.error);
