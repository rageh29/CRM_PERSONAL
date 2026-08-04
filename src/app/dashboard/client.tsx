'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatCard, RecentInvoicesList, BestWorstCard } from '@/features/dashboard/components';
import { MonthlyChart } from '@/features/dashboard/Chart';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats, MonthlyData, BestWorstMonth } from '@/lib/types';

interface DashboardClientProps {
  stats: DashboardStats;
  monthlyData: MonthlyData[];
  recentInvoices: any[];
  bestWorst: BestWorstMonth;
}

export function DashboardClient({ stats, monthlyData, recentInvoices, bestWorst }: DashboardClientProps) {
  const { data: session } = useSession();
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [isMorning, setIsMorning] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setIsMorning(hour < 12);
  }, []);

  const userName = session?.user?.name || 'المستخدم';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Dynamic Header with Greeting & Supplication (Icons AFTER text) */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {mounted ? (isMorning ? 'صباح الخير' : 'مساء الخير') : 'مرحباً'}، {userName}
          </h1>

          {/* Greeting Icon AFTER text */}
          {mounted && isMorning ? (
            <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <span>بارك الله في سعيك ورزقك</span>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 stagger-children">
        <StatCard
          title="إجمالي الإيرادات"
          value={stats.totalRevenue}
          change={stats.revenueChange}
          color="revenue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatCard
          title="إجمالي النفقات"
          value={stats.totalExpense}
          change={stats.expenseChange}
          color="expense"
          invertChange
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
            </svg>
          }
        />
        <StatCard
          title="المسترجعات"
          value={stats.totalReturn}
          change={stats.returnChange}
          color="return"
          invertChange
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          }
        />
        <StatCard
          title="رواتب الموظفين"
          value={stats.totalSalary}
          change={stats.salaryChange}
          color="salary"
          invertChange
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          title="صافي الربح"
          value={stats.netProfit}
          change={0}
          color="primary"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="عدد الفواتير"
          value={stats.invoiceCount}
          change={0}
          color="primary"
          isCount={true}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">الإحصائيات الشهرية للأداء المالي</h2>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              أعمدة
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              خطوط
            </button>
          </div>
        </div>
        <MonthlyChart data={monthlyData} type={chartType} />
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">آخر الفواتير المسجلة</h2>
            <a href="/dashboard/invoices" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
              عرض الكل
            </a>
          </div>
          <RecentInvoicesList invoices={recentInvoices} />
        </div>

        {/* Best/Worst */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">أفضل وأقل الأشهر ربحية</h2>
          <BestWorstCard best={bestWorst.best} worst={bestWorst.worst} />

          {/* Quick Summary */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
            <p className="text-[11px] font-semibold text-slate-500 mb-1">ملخص صافي ربح الشهر الحاضر</p>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {stats.netProfit >= 0
                ? `صافي الربح لهذا الشهر: ${formatCurrency(stats.netProfit)}`
                : `عجز هذا الشهر: ${formatCurrency(Math.abs(stats.netProfit))}`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
