'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { calculatePercentageChange, getArabicMonth } from '@/lib/utils';
import type { DashboardStats, MonthlyData, BestWorstMonth } from '@/lib/types';

async function getTenantWhere() {
  const session = await auth();
  const user = session?.user as any;
  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');
  const tenantId = user?.tenantId || null;
  return !isMasterAdmin && tenantId ? { tenantId } : {};
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const tenantWhere = await getTenantWhere();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
  const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  // Current month totals
  const currentInvoices = await prisma.invoice.findMany({
    where: { ...tenantWhere, date: { gte: startOfMonth, lte: endOfMonth } },
  });

  // Previous month totals
  const prevInvoices = await prisma.invoice.findMany({
    where: { ...tenantWhere, date: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
  });

  const sum = (invoices: typeof currentInvoices, category: string) =>
    invoices.filter((i) => i.category === category).reduce((acc, i) => acc + i.amount, 0);

  const totalRevenue = sum(currentInvoices, 'REVENUE');
  const totalExpense = sum(currentInvoices, 'EXPENSE');
  const totalReturn = sum(currentInvoices, 'RETURN');
  const totalSalary = sum(currentInvoices, 'SALARY');

  const prevRevenue = sum(prevInvoices, 'REVENUE');
  const prevExpense = sum(prevInvoices, 'EXPENSE');
  const prevReturn = sum(prevInvoices, 'RETURN');
  const prevSalary = sum(prevInvoices, 'SALARY');

  const totalInvoiceCount = await prisma.invoice.count({ where: tenantWhere });

  return {
    totalRevenue,
    totalExpense,
    totalReturn,
    totalSalary,
    netProfit: totalRevenue - totalExpense - totalReturn - totalSalary,
    invoiceCount: totalInvoiceCount,
    revenueChange: calculatePercentageChange(totalRevenue, prevRevenue),
    expenseChange: calculatePercentageChange(totalExpense, prevExpense),
    returnChange: calculatePercentageChange(totalReturn, prevReturn),
    salaryChange: calculatePercentageChange(totalSalary, prevSalary),
  };
}

export async function getMonthlyData(year?: number): Promise<MonthlyData[]> {
  const tenantWhere = await getTenantWhere();
  const targetYear = year || new Date().getFullYear();
  const data: MonthlyData[] = [];

  for (let month = 0; month < 12; month++) {
    const start = new Date(targetYear, month, 1);
    const end = new Date(targetYear, month + 1, 0, 23, 59, 59);

    const invoices = await prisma.invoice.findMany({
      where: { ...tenantWhere, date: { gte: start, lte: end } },
    });

    data.push({
      month: getArabicMonth(month),
      revenue: invoices.filter((i) => i.category === 'REVENUE').reduce((a, i) => a + i.amount, 0),
      expense: invoices.filter((i) => i.category === 'EXPENSE').reduce((a, i) => a + i.amount, 0),
      returns: invoices.filter((i) => i.category === 'RETURN').reduce((a, i) => a + i.amount, 0),
      salary: invoices.filter((i) => i.category === 'SALARY').reduce((a, i) => a + i.amount, 0),
    });
  }

  return data;
}

export async function getRecentInvoices(limit: number = 5) {
  const tenantWhere = await getTenantWhere();
  return prisma.invoice.findMany({
    where: tenantWhere,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { createdBy: { select: { name: true } } },
  });
}

export async function getBestWorstMonths(year?: number): Promise<BestWorstMonth> {
  const monthlyData = await getMonthlyData(year);
  const withNet = monthlyData.map((m) => ({
    month: m.month,
    net: m.revenue - m.expense - m.returns - m.salary,
  }));

  const sorted = [...withNet].sort((a, b) => b.net - a.net);
  return {
    best: { month: sorted[0]?.month || '-', amount: sorted[0]?.net || 0 },
    worst: { month: sorted[sorted.length - 1]?.month || '-', amount: sorted[sorted.length - 1]?.net || 0 },
  };
}
