import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/types';
import { redirect } from 'next/navigation';
import { ActivityClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ActivityPage() {
  const session = await auth();
  const user = session?.user as any;
  const userRole = user?.role as string || 'EMPLOYEE';
  const userPermissions = user?.permissions || [];
  const isMasterAdmin = Boolean(user?.isMasterAdmin || userRole === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;

  if (!hasPermission(userRole, userPermissions, 'activity:view')) {
    redirect('/dashboard');
  }

  // CRITICAL: Only fetch activity logs belonging to the same tenant (tenant isolation)
  const where: any = {};
  if (!isMasterAdmin && tenantId) {
    where.tenantId = tenantId;
  }

  const activities = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, role: true } } },
  });

  const serialized = activities.map((a: any) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return <ActivityClient activities={serialized} />;
}
