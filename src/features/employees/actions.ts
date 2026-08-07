'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { employeeSchema, type EmployeeInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

async function getSessionTenant() {
  const session = await auth();
  if (!session?.user) throw new Error('غير مصرح لك بإجراء هذه العملية');
  const user = session.user as any;
  const isMasterAdmin = Boolean(user.isMasterAdmin || user.role === 'MASTER_ADMIN');
  return { userId: user.id as string, tenantId: user.tenantId as string | null, isMasterAdmin };
}

export async function createEmployee(data: EmployeeInput) {
  const { userId, tenantId } = await getSessionTenant();

  const validated = employeeSchema.parse(data);

  const employee = await prisma.employee.create({
    data: {
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone || null,
      position: validated.position,
      salary: validated.salary,
      currency: validated.currency,
      tenantId: tenantId || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'CREATE',
      entityType: 'Employee',
      entityId: employee.id,
      details: JSON.stringify({ name: employee.name, position: employee.position }),
      userId,
      tenantId: tenantId || null,
    },
  });

  revalidatePath('/dashboard/employees');
  return employee;
}

export async function updateEmployee(id: string, data: EmployeeInput) {
  const { userId, tenantId, isMasterAdmin } = await getSessionTenant();

  const validated = employeeSchema.parse(data);

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new Error('الموظف غير موجود');
  if (!isMasterAdmin && tenantId && existing.tenantId !== tenantId) {
    throw new Error('غير مصرح لك بتعديل بيانات هذا الموظف');
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone || null,
      position: validated.position,
      salary: validated.salary,
      currency: validated.currency,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'Employee',
      entityId: employee.id,
      details: JSON.stringify({ name: employee.name }),
      userId,
      tenantId: tenantId || null,
    },
  });

  revalidatePath('/dashboard/employees');
  return employee;
}

export async function deleteEmployee(id: string) {
  const { userId, tenantId, isMasterAdmin } = await getSessionTenant();

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new Error('الموظف غير موجود');
  if (!isMasterAdmin && tenantId && existing.tenantId !== tenantId) {
    throw new Error('غير مصرح لك بحذف هذا الموظف');
  }

  const employee = await prisma.employee.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      action: 'DELETE',
      entityType: 'Employee',
      entityId: id,
      details: JSON.stringify({ name: employee.name }),
      userId,
      tenantId: tenantId || null,
    },
  });

  revalidatePath('/dashboard/employees');
}

export async function getEmployees() {
  const session = await auth();
  const user = session?.user as any;
  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;

  const where = !isMasterAdmin && tenantId ? { tenantId } : {};

  return prisma.employee.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { invoices: true } } },
  });
}
