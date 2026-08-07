'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { invoiceSchema, type InvoiceInput } from '@/lib/validations';
import { generateInvoiceNumber } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

async function getSessionTenant() {
  const session = await auth();
  if (!session?.user) throw new Error('غير مصرح لك بإجراء هذه العملية');
  const user = session.user as any;
  const isMasterAdmin = Boolean(user.isMasterAdmin || user.role === 'MASTER_ADMIN');
  return { userId: user.id as string, tenantId: user.tenantId as string | null, isMasterAdmin };
}

export async function createInvoice(data: InvoiceInput & { attachment?: string }) {
  const { userId, tenantId } = await getSessionTenant();

  const validated = invoiceSchema.parse(data);

  // Generate unique invoice number safely
  const count = await prisma.invoice.count({ where: tenantId ? { tenantId } : {} });
  let counter = count + 1;
  let invoiceNumber = generateInvoiceNumber(counter);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      name: validated.name,
      description: validated.description || null,
      amount: validated.amount,
      currency: validated.currency,
      category: validated.category,
      date: new Date(validated.date),
      employeeId: validated.employeeId || null,
      attachment: data.attachment || null,
      createdById: userId,
      tenantId: tenantId || null,
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      details: JSON.stringify({ name: invoice.name, amount: invoice.amount, category: invoice.category }),
      userId,
      tenantId: tenantId || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices');
  return invoice;
}

export async function updateInvoice(id: string, data: InvoiceInput) {
  const { userId, tenantId, isMasterAdmin } = await getSessionTenant();

  const validated = invoiceSchema.parse(data);

  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw new Error('الفاتورة غير موجودة');
  if (!isMasterAdmin && tenantId && existing.tenantId !== tenantId) {
    throw new Error('غير مصرح لك بتعديل هذه الفاتورة');
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description || null,
      amount: validated.amount,
      currency: validated.currency,
      category: validated.category,
      date: new Date(validated.date),
      employeeId: validated.employeeId || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      details: JSON.stringify({ name: invoice.name, amount: invoice.amount }),
      userId,
      tenantId: tenantId || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices');
  revalidatePath(`/dashboard/invoices/${id}`);
  return invoice;
}

export async function deleteInvoice(id: string) {
  const { userId, tenantId, isMasterAdmin } = await getSessionTenant();

  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw new Error('الفاتورة غير موجودة');
  if (!isMasterAdmin && tenantId && existing.tenantId !== tenantId) {
    throw new Error('غير مصرح لك بحذف هذه الفاتورة');
  }

  const invoice = await prisma.invoice.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      action: 'DELETE',
      entityType: 'Invoice',
      entityId: id,
      details: JSON.stringify({ name: invoice.name, invoiceNumber: invoice.invoiceNumber }),
      userId,
      tenantId: tenantId || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices');
}

export async function getInvoices(filters?: {
  category?: string;
  currency?: string;
  search?: string;
  month?: string;
  year?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const session = await auth();
  const user = session?.user as any;
  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;

  const where: any = {};
  if (!isMasterAdmin && tenantId) {
    where.tenantId = tenantId;
  }

  if (filters?.category) where.category = filters.category;
  if (filters?.currency) where.currency = filters.currency;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { invoiceNumber: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  if (filters?.month || filters?.year) {
    const year = parseInt(filters?.year || String(new Date().getFullYear()));
    const month = filters?.month ? parseInt(filters.month) - 1 : undefined;

    if (month !== undefined) {
      where.date = {
        gte: new Date(year, month, 1),
        lt: new Date(year, month + 1, 1),
      };
    } else {
      where.date = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    }
  }

  const orderBy: any[] = [];
  if (filters?.sortBy) {
    orderBy.push({ [filters.sortBy]: filters.sortOrder || 'desc' });
  }
  orderBy.push({ createdAt: 'desc' });
  orderBy.push({ date: 'desc' });

  return prisma.invoice.findMany({
    where,
    orderBy,
    include: {
      createdBy: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });
}

export async function getInvoice(id: string) {
  const session = await auth();
  const user = session?.user as any;
  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      employee: { select: { name: true, position: true } },
    },
  });

  if (!invoice) return null;
  if (!isMasterAdmin && tenantId && invoice.tenantId !== tenantId) {
    return null;
  }

  return invoice;
}
