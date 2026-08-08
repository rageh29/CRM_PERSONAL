import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { SettingsClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user as any;
  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;

  // CRITICAL: Fetch settings for the correct tenant (tenant isolation)
  let settings;
  if (!isMasterAdmin && tenantId) {
    settings = await prisma.systemSettings.findFirst({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { tenantId, companyName: user?.tenantName || 'متجري' },
      });
    }
  } else {
    settings = await prisma.systemSettings.findFirst({ where: { tenantId: null } });
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { companyName: 'High System' } });
    }
  }

  const serialized = { ...settings, createdAt: settings.createdAt.toISOString(), updatedAt: settings.updatedAt.toISOString() };
  return <SettingsClient settings={serialized} />;
}
