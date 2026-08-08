import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ReportsClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReportsPage() {
  const session = await auth();
  const user = session?.user as any;
  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;

  // CRITICAL: Only fetch invoices belonging to the same tenant (tenant isolation)
  const where: any = {};
  if (!isMasterAdmin && tenantId) {
    where.tenantId = tenantId;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { createdBy: { select: { name: true } } },
  });

  const serialized = invoices.map((inv: any) => ({
    ...inv,
    date: inv.date.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  }));

  return <ReportsClient invoices={serialized} />;
}
