import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * Helper: Get authenticated user's session with tenant context.
 * Returns userId, tenantId, isMasterAdmin, and role.
 */
async function getAuthContext() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as any;
  return {
    userId: user.id as string,
    role: user.role as string,
    tenantId: (user.tenantId as string) || null,
    isMasterAdmin: Boolean(user.isMasterAdmin || user.role === 'MASTER_ADMIN'),
  };
}

// POST - Create new user/employee
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  // Only SUPER_ADMIN or MASTER_ADMIN can create users
  if (!ctx.isMasterAdmin && ctx.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'غير مصرح لك بإضافة مستخدمين' }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role, permissions } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  // CRITICAL: Attach the new user to the SAME tenant as the creator (tenant isolation)
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      password: hashed,
      role: role || 'EMPLOYEE',
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions || []),
      tenantId: ctx.tenantId,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      details: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });
}

// PUT - Update existing user/employee
export async function PUT(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  if (!ctx.isMasterAdmin && ctx.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'غير مصرح لك بتعديل المستخدمين' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });

  const body = await req.json();
  const { name, email, password, role, permissions } = body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });

  // CRITICAL: Prevent editing users from OTHER tenants (tenant isolation)
  if (!ctx.isMasterAdmin && ctx.tenantId && user.tenantId !== ctx.tenantId) {
    return NextResponse.json({ error: 'غير مصرح لك بتعديل هذا المستخدم' }, { status: 403 });
  }

  const cleanEmail = email?.trim().toLowerCase() || user.email;

  // Check email uniqueness (exclude current user)
  if (cleanEmail !== user.email) {
    const emailTaken = await prisma.user.findFirst({
      where: { email: cleanEmail, id: { not: id } },
    });
    if (emailTaken) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل بحساب آخر' }, { status: 400 });
    }
  }

  const updateData: any = {
    name: name?.trim() || user.name,
    email: cleanEmail,
    role: role || user.role,
    permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions || []),
  };

  if (password && password.trim().length >= 6) {
    updateData.password = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  await prisma.activityLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'User',
      entityId: updated.id,
      details: JSON.stringify({ name: updated.name, role: updated.role }),
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    permissions: updated.permissions,
  });
}

// DELETE - Remove user/employee
export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  if (!ctx.isMasterAdmin && ctx.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'غير مصرح لك بحذف المستخدمين' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'المعرّف مطلوب' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });

  // CRITICAL: Prevent deleting users from OTHER tenants (tenant isolation)
  if (!ctx.isMasterAdmin && ctx.tenantId && user.tenantId !== ctx.tenantId) {
    return NextResponse.json({ error: 'غير مصرح لك بحذف هذا المستخدم' }, { status: 403 });
  }

  if (user.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'لا يمكن حذف حساب السوبر أدمن' }, { status: 403 });
  }

  // Prevent deleting yourself
  if (user.id === ctx.userId) {
    return NextResponse.json({ error: 'لا يمكنك حذف حسابك الخاص' }, { status: 403 });
  }

  // Clean up related records before deleting user
  // 1. Delete activity logs (non-financial, safe to remove)
  await prisma.activityLog.deleteMany({ where: { userId: id } });
  // 2. Reassign invoices to the admin performing the deletion (invoices are financial records — NEVER delete them)
  await prisma.invoice.updateMany({ where: { createdById: id }, data: { createdById: ctx.userId } });
  // 3. Delete the user
  await prisma.user.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      details: JSON.stringify({ name: user.name, email: user.email }),
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    },
  });

  return NextResponse.json({ success: true });
}
