import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    let masterAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'master@highsystem.com' },
          { email: 'admin@error.com' },
          { isMasterAdmin: true },
          { role: 'MASTER_ADMIN' }
        ],
      },
    });

    if (!masterAdmin) {
      masterAdmin = await prisma.user.create({
        data: {
          name: 'المالك الرئيسي للنظام',
          email: 'master@highsystem.com',
          password: hashedPassword,
          role: 'MASTER_ADMIN',
          isMasterAdmin: true,
          permissions: '["*"]',
        },
      });
    } else {
      masterAdmin = await prisma.user.update({
        where: { id: masterAdmin.id },
        data: {
          email: 'master@highsystem.com',
          password: hashedPassword,
          role: 'MASTER_ADMIN',
          isMasterAdmin: true,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل وإنشاء حساب المالك الرئيسي بنجاح',
      email: masterAdmin.email,
      password: 'admin123',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
