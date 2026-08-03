import { getDashboardStats, getMonthlyData, getRecentInvoices, getBestWorstMonths } from '@/features/dashboard/actions';
import { DashboardClient } from '@/app/dashboard/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const [stats, monthlyData, recentInvoices, bestWorst] = await Promise.all([
    getDashboardStats(),
    getMonthlyData(),
    getRecentInvoices(6),
    getBestWorstMonths(),
  ]);

  // Serialize dates for client
  const serializedInvoices = recentInvoices.map((inv: any) => ({
    ...inv,
    date: inv.date.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      stats={stats}
      monthlyData={monthlyData}
      recentInvoices={serializedInvoices}
      bestWorst={bestWorst}
    />
  );
}
