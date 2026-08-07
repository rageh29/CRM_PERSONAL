import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let masterAdmin = await prisma.user.findFirst({
      where: {
        OR: [{ isMasterAdmin: true }, { role: 'MASTER_ADMIN' }],
      },
    });

    if (!masterAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      masterAdmin = await prisma.user.create({
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

    return NextResponse.json({
      success: true,
      message: 'Master Admin initialized successfully',
      email: masterAdmin.email,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
