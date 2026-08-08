import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ logo: null });
  }

  const user = session.user as any;
  const isMasterAdmin = Boolean(user.isMasterAdmin || user.role === 'MASTER_ADMIN');
  const tenantId = user.tenantId || null;

  const where = (!isMasterAdmin && tenantId) ? { tenantId } : { tenantId: null };

  const settings = await prisma.systemSettings.findFirst({
    where,
    select: { companyLogo: true, companyName: true },
  });

  const isPlatformUser = isMasterAdmin || !tenantId;
  const defaultName = isPlatformUser ? 'High System' : (user.tenantName || 'متجري');
  let companyName = settings?.companyName;

  if (!companyName || companyName === 'نظام ايرور المحاسبي' || companyName === 'شركتي') {
    companyName = defaultName;
  }

  return NextResponse.json({
    logo: settings?.companyLogo || null,
    companyName,
  });
}
