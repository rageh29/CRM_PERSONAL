import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  const userId = user?.id;
  const userRole = user?.role;
  const isMasterAdmin = Boolean(user?.isMasterAdmin || userRole === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;

  // Only SUPER_ADMIN or MASTER_ADMIN can reset
  if (!session?.user || (!isMasterAdmin && userRole !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'غير مصرح لك بإجراء هذه العملية' }, { status: 403 });
  }

  try {
    // CRITICAL: Scope deletion to the user's own tenant only (tenant isolation)
    const scopeWhere = isMasterAdmin ? { tenantId: null } : { tenantId };

    // 1. Delete invoices scoped to tenant
    await prisma.invoice.deleteMany({ where: scopeWhere as any });

    // 2. Delete employees scoped to tenant
    await prisma.employee.deleteMany({ where: scopeWhere as any });

    // 3. Clear activity logs scoped to tenant
    await prisma.activityLog.deleteMany({ where: scopeWhere as any });

    // 4. Delete all non-admin users within the same tenant
    await prisma.user.deleteMany({
      where: {
        ...scopeWhere as any,
        role: { not: isMasterAdmin ? 'MASTER_ADMIN' : 'SUPER_ADMIN' },
        id: { not: userId },
      },
    });

    // 5. Create fresh log entry for the reset
    if (userId) {
      await prisma.activityLog.create({
        data: {
          action: 'DELETE',
          entityType: 'DemoDataReset',
          details: 'تم حذف جميع البيانات التجريبية مع الإبقاء على حساب الأدمن فقط',
          userId,
          tenantId,
        } as any,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم مسح كافة البيانات التجريبية بنجاح، وتفريغ الفواتير والموظفين والمستخدمين مع الإبقاء على حسابك الإداري.',
    });
  } catch (error: any) {
    console.error('Reset Demo Data Error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء تفريغ البيانات التجريبية' },
      { status: 500 }
    );
  }
}
