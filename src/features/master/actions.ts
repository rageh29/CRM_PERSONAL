'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateActivationCodeString } from '@/lib/codeGenerator';
import { revalidatePath } from 'next/cache';

async function checkMasterAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('غير مصرح لك بإجراء هذه العملية');
  }

  const user = session.user as any;
  if (!user.isMasterAdmin && user.role !== 'MASTER_ADMIN') {
    throw new Error('هذه اللوحة خاصة بالمالك الرئيسي للنظام فقط');
  }

  return user;
}

export async function getMasterDashboardData() {
  await checkMasterAdmin();

  const [codes, tenants, totalUsers] = await Promise.all([
    prisma.activationCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        usedByTenant: {
          select: { name: true, ownerName: true, email: true, phone: true },
        },
      },
    }),
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { invoices: true } },
      },
    }),
    prisma.user.count({ where: { isMasterAdmin: false } }),
  ]);

  const activeCodes = codes.filter((c) => !c.isUsed).length;
  const usedCodes = codes.filter((c) => c.isUsed).length;
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;

  return {
    codes,
    tenants,
    stats: {
      totalCodes: codes.length,
      activeCodes,
      usedCodes,
      totalTenants: tenants.length,
      activeTenants,
      totalUsers,
    },
  };
}

export async function generateActivationCodes(count: number, durationDays: number, note?: string) {
  await checkMasterAdmin();

  if (count <= 0 || count > 50) {
    throw new Error('عدد الأكواد يجب أن يكون بين 1 و 50 كود في المرة الواحدة');
  }
  if (durationDays <= 0) {
    throw new Error('مدة التفعيل يجب أن تكون يوماً واحداً على الأقل');
  }

  const createdCodes = [];
  for (let i = 0; i < count; i++) {
    let codeStr = generateActivationCodeString('ERR');
    // Ensure code uniqueness
    let exists = await prisma.activationCode.findUnique({ where: { code: codeStr } });
    while (exists) {
      codeStr = generateActivationCodeString('ERR');
      exists = await prisma.activationCode.findUnique({ where: { code: codeStr } });
    }

    const codeRec = await prisma.activationCode.create({
      data: {
        code: codeStr,
        durationDays,
        note: note?.trim() || null,
      },
    });
    createdCodes.push(codeRec);
  }

  revalidatePath('/dashboard/master');
  return { success: true, count: createdCodes.length };
}

export async function deleteActivationCode(codeId: string) {
  await checkMasterAdmin();

  const codeObj = await prisma.activationCode.findUnique({ where: { id: codeId } });
  if (!codeObj) throw new Error('الكود غير موجود');
  if (codeObj.isUsed) throw new Error('لا يمكن حذف كود تم استخدامه لتفعيل متجر');

  await prisma.activationCode.delete({ where: { id: codeId } });
  revalidatePath('/dashboard/master');
  return { success: true };
}

export async function toggleTenantStatus(tenantId: string, status: 'ACTIVE' | 'SUSPENDED') {
  await checkMasterAdmin();

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status },
  });

  revalidatePath('/dashboard/master');
  return { success: true };
}

export async function extendTenantSubscription(tenantId: string, extraDays: number) {
  await checkMasterAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('المتجر غير موجود');

  const currentEndDate = tenant.subscriptionEndsAt && tenant.subscriptionEndsAt > new Date()
    ? new Date(tenant.subscriptionEndsAt)
    : new Date();

  const newEndDate = new Date(currentEndDate.getTime() + extraDays * 24 * 60 * 60 * 1000);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionEndsAt: newEndDate,
      status: 'ACTIVE',
    },
  });

  revalidatePath('/dashboard/master');
  return { success: true, newEndDate };
}

export async function deleteTenant(tenantId: string) {
  await checkMasterAdmin();

  // Delete all store data
  await prisma.invoice.deleteMany({ where: { tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  await prisma.activityLog.deleteMany({ where: { tenantId } });
  await prisma.systemSettings.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });

  revalidatePath('/dashboard/master');
  return { success: true };
}
