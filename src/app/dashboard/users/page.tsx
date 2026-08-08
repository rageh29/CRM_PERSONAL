import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/types';
import { redirect } from 'next/navigation';
import { UsersClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UsersPage() {
  const session = await auth();
  const user = session?.user as any;
  const userRole = user?.role as string || 'EMPLOYEE';
  const userPermissions = user?.permissions || [];
  const isMasterAdmin = Boolean(user?.isMasterAdmin || userRole === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;

  if (!hasPermission(userRole, userPermissions, 'users:manage')) {
    redirect('/dashboard');
  }

  // CRITICAL: Tenant isolation
  // Master Admin sees only platform-level users (tenantId is null) — NOT tenant merchants/employees
  // Tenant admins see only their own tenant's users
  const where: any = {};
  if (isMasterAdmin) {
    where.tenantId = null;
  } else if (tenantId) {
    where.tenantId = tenantId;
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      isActive: true,
      createdAt: true,
      tenantId: true,
    },
  });

  const serialized = users.map((u: any) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return <UsersClient users={serialized} />;
}
