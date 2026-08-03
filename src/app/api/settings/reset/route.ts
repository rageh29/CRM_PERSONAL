import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  if (!session?.user || userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'غير مصرح لك بإجراء هذه العملية' }, { status: 403 });
  }

  try {
    // 1. Delete all invoices
    await prisma.invoice.deleteMany({});

    // 2. Delete all employees
    await prisma.employee.deleteMany({});

    // 3. Clear activity logs first to satisfy foreign key constraint
    await prisma.activityLog.deleteMany({});

    // 4. Delete all non-SUPER_ADMIN users
    await prisma.user.deleteMany({
      where: {
        role: {
          not: 'SUPER_ADMIN',
        },
      },
    });

    // 5. Create fresh log entry for the reset
    if (userId) {
      await prisma.activityLog.create({
        data: {
          action: 'DELETE',
          entityType: 'DemoDataReset',
          details: 'تم حذف جميع البيانات التجريبية في المنصة مع الإبقاء على حساب السوبر أدمن فقط',
          userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم مسح كافة البيانات التجريبية بنجاح، وتفريغ الفواتير والموظفين والمستخدمين مع الإبقاء على حساب السوبر أدمن.',
    });
  } catch (error: any) {
    console.error('Reset Demo Data Error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء تفريغ البيانات التجريبية' },
      { status: 500 }
    );
  }
}
