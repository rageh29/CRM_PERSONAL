import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isMasterAdmin = Boolean((session?.user as any)?.isMasterAdmin || userRole === 'MASTER_ADMIN');
  const tenantId = (session?.user as any)?.tenantId || null;

  if (!session?.user || (!isMasterAdmin && userRole !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'غير مصرح لك بتعديل الإعدادات' }, { status: 403 });
  }

  const body = await req.json();

  // Find or update System Settings for current tenant/master
  const existingSettings = await prisma.systemSettings.findFirst({
    where: (isMasterAdmin ? { tenantId: null } : { tenantId }) as any,
  });

  let settings;
  if (existingSettings) {
    settings = await prisma.systemSettings.update({
      where: { id: existingSettings.id },
      data: {
        companyName: body.companyName,
        companyLogo: body.companyLogo !== undefined ? (body.companyLogo || null) : existingSettings.companyLogo,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        contactAddress: body.contactAddress || null,
        defaultCurrency: body.defaultCurrency,
      },
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: {
        companyName: body.companyName,
        companyLogo: body.companyLogo || null,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        contactAddress: body.contactAddress || null,
        defaultCurrency: body.defaultCurrency,
        tenantId: isMasterAdmin ? null : tenantId,
      } as any,
    });
  }

  // Also update Tenant table name if applicable
  if (!isMasterAdmin && tenantId && body.companyName) {
    try {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { name: body.companyName },
      });
    } catch (e) {}
  }

  // Update Account Details (Email / Password) if provided
  if (userId) {
    const userUpdateData: any = {};

    if (body.adminEmail && body.adminEmail.trim() !== '') {
      const cleanEmail = body.adminEmail.trim().toLowerCase();
      // Check if email taken by another user
      const existing = await prisma.user.findFirst({
        where: { email: cleanEmail, id: { not: userId } },
      });
      if (existing) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل بحساب آخر' }, { status: 400 });
      }
      userUpdateData.email = cleanEmail;
    }

    if (body.adminPassword && body.adminPassword.trim().length >= 6) {
      userUpdateData.password = await bcrypt.hash(body.adminPassword.trim(), 12);
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'Settings',
      details: JSON.stringify({ companyName: body.companyName, updatedAdminAccount: !!body.adminPassword || !!body.adminEmail }),
      userId: userId || 'system',
      tenantId: tenantId || null,
    } as any,
  });

  return NextResponse.json(settings);
}
