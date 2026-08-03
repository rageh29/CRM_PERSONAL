import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/types';
import { redirect } from 'next/navigation';
import { ActivityClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ActivityPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string || 'EMPLOYEE';
  const userPermissions = (session?.user as any)?.permissions || [];

  if (!hasPermission(userRole, userPermissions, 'activity:view')) {
    redirect('/dashboard');
  }

  const activities = await prisma.activityLog.findMany({
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
