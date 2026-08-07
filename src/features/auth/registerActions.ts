'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface RegisterMerchantInput {
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  password: string;
  activationCode: string;
}

export async function registerMerchantStore(input: RegisterMerchantInput) {
  const { storeName, ownerName, phone, email, password, activationCode } = input;

  if (!storeName?.trim()) throw new Error('يرجى كتابة اسم المتجر');
  if (!ownerName?.trim()) throw new Error('يرجى كتابة اسم التاجر / المستخدم');
  if (!email?.trim() || !email.includes('@')) throw new Error('يرجى إدخال بريد إلكتروني صحيح');
  if (!password || password.length < 6) throw new Error('كلمة المرور يجب أن لا تقل عن 6 خانات');
  if (!activationCode?.trim()) throw new Error('يرجى إدخال كود التفعيل');

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = activationCode.trim().toUpperCase();

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });
  if (existingUser) {
    throw new Error('هذا البريد الإلكتروني مستخدم بالفعل، يرجى استخدام بريد آخر');
  }

  // Validate activation code
  const codeRecord = await prisma.activationCode.findUnique({
    where: { code: cleanCode },
  });

  if (!codeRecord) {
    throw new Error('كود التفعيل المدخل غير صحيح، يرجى التأكد من الكود');
  }

  if (codeRecord.isUsed) {
    throw new Error('كود التفعيل هذا تم استخدامه سابقاً لتفعيل متجر آخر');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date();
  const subscriptionEndsAt = new Date(now.getTime() + codeRecord.durationDays * 24 * 60 * 60 * 1000);

  // Execute transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Tenant Store
    const tenant = await tx.tenant.create({
      data: {
        name: storeName.trim(),
        ownerName: ownerName.trim(),
        phone: phone?.trim() || null,
        email: cleanEmail,
        status: 'ACTIVE',
        subscriptionEndsAt,
      },
    });

    // 2. Mark Activation Code as Used
    await tx.activationCode.update({
      where: { id: codeRecord.id },
      data: {
        isUsed: true,
        usedByTenantId: tenant.id,
        usedAt: now,
      },
    });

    // 3. Create Super Admin User for the Merchant
    const user = await tx.user.create({
      data: {
        name: ownerName.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        permissions: '["ALL"]',
        tenantId: tenant.id,
      },
    });

    // 4. Create default System Settings for Store
    await tx.systemSettings.create({
      data: {
        companyName: storeName.trim(),
        contactEmail: cleanEmail,
        contactPhone: phone?.trim() || null,
        tenantId: tenant.id,
      },
    });

    // 5. Log Activity
    await tx.activityLog.create({
      data: {
        action: 'CREATE',
        entityType: 'TenantRegistration',
        entityId: tenant.id,
        details: `تسجيل وتفعيل متجر جديد "${storeName}" عبر كود التفعيل ${cleanCode}`,
        userId: user.id,
        tenantId: tenant.id,
      },
    });

    return { tenant, user };
  });

  return {
    success: true,
    email: cleanEmail,
    storeName: result.tenant.name,
  };
}

export async function renewStoreWithCode(tenantId: string, activationCode: string) {
  if (!activationCode?.trim()) throw new Error('يرجى إدخال كود التفعيل');

  const cleanCode = activationCode.trim().toUpperCase();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('المتجر غير موجود');

  const codeRecord = await prisma.activationCode.findUnique({
    where: { code: cleanCode },
  });

  if (!codeRecord) throw new Error('كود التفعيل المدخل غير صحيح');
  if (codeRecord.isUsed) throw new Error('كود التفعيل هذا تم استخدامه سابقاً');

  const currentEndDate = tenant.subscriptionEndsAt && tenant.subscriptionEndsAt > new Date()
    ? new Date(tenant.subscriptionEndsAt)
    : new Date();

  const newEndDate = new Date(currentEndDate.getTime() + codeRecord.durationDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionEndsAt: newEndDate,
        status: 'ACTIVE',
      },
    });

    await tx.activationCode.update({
      where: { id: codeRecord.id },
      data: {
        isUsed: true,
        usedByTenantId: tenantId,
        usedAt: new Date(),
      },
    });
  });

  return { success: true, newEndDate };
}
