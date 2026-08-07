import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface TenantSessionContext {
  userId: string;
  userRole: string;
  isMasterAdmin: boolean;
  tenantId: string | null;
  tenantName: string | null;
  subscriptionEndsAt: Date | null;
  isExpired: boolean;
}

export async function getTenantContext(): Promise<TenantSessionContext | null> {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as any;
  const isMasterAdmin = Boolean(user.isMasterAdmin || user.role === 'MASTER_ADMIN');
  const tenantId = user.tenantId || null;

  let tenantName: string | null = user.tenantName || null;
  let subscriptionEndsAt: Date | null = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
  let isExpired = false;

  if (tenantId && !isMasterAdmin) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, status: true, subscriptionEndsAt: true },
    });

    if (tenant) {
      tenantName = tenant.name;
      subscriptionEndsAt = tenant.subscriptionEndsAt;
      if (tenant.status === 'SUSPENDED' || (tenant.subscriptionEndsAt && new Date() > new Date(tenant.subscriptionEndsAt))) {
        isExpired = true;
      }
    }
  }

  return {
    userId: user.id,
    userRole: user.role,
    isMasterAdmin,
    tenantId,
    tenantName,
    subscriptionEndsAt,
    isExpired,
  };
}
