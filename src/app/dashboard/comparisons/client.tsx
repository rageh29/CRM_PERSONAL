'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, calculatePercentageChange, getArabicMonth } from '@/lib/utils';
import { getPeriodFinancialMetrics, type FinancialPeriodMetrics } from '@/features/comparisons/actions';

type ComparisonMode = 'DAYS' | 'RANGES' | 'MONTHS' | 'YEARS';

export function ComparisonsClient({ monthlyData }: { monthlyData: any[] }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const [mode, setMode] = useState<ComparisonMode>('MONTHS');
  const [loading, setLoading] = useState(false);

  // Day mode
  const [day1, setDay1] = useState(yesterdayStr);
  const [day2, setDay2] = useState(todayStr);

  // Range mode
  const [range1Start, setRange1Start] = useState(new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]);
  const [range1End, setRange1End] = useState(new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]);
  const [range2Start, setRange2Start] = useState(new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]);
  const [range2End, setRange2End] = useState(todayStr);

  // Month mode
  const [month1, setMonth1] = useState(String(Math.max(currentMonth - 1, 0)));
  const [month2, setMonth2] = useState(String(currentMonth));

  // Year mode
  const [year1, setYear1] = useState(String(currentYear - 1));
  const [year2, setYear2] = useState(String(currentYear));

  // Metrics states
  const [metrics1, setMetrics1] = useState<FinancialPeriodMetrics>({
    revenue: 0, expense: 0, returns: 0, salary: 0, netProfit: 0, count: 0,
  });
  const [metrics2, setMetrics2] = useState<FinancialPeriodMetrics>({
    revenue: 0, expense: 0, returns: 0, salary: 0, netProfit: 0, count: 0,
  });
  const [label1, setLabel1] = useState('');
  const [label2, setLabel2] = useState('');

  // Fetch comparison data dynamically
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (mode === 'DAYS') {
          const m1 = await getPeriodFinancialMetrics(day1, day1);
          const m2 = await getPeriodFinancialMetrics(day2, day2);
          setMetrics1(m1);
          setMetrics2(m2);
          setLabel1(`يوم ${day1}`);
          setLabel2(`يوم ${day2}`);
        } else if (mode === 'RANGES') {
          const m1 = await getPeriodFinancialMetrics(range1Start, range1End);
          const m2 = await getPeriodFinancialMetrics(range2Start, range2End);
          setMetrics1(m1);
          setMetrics2(m2);
          setLabel1(`من ${range1Start} إلى ${range1End}`);
          setLabel2(`من ${range2Start} إلى ${range2End}`);
        } else if (mode === 'MONTHS') {
          const idx1 = parseInt(month1);
          const idx2 = parseInt(month2);
          const d1 = monthlyData[idx1] || { revenue: 0, expense: 0, returns: 0, salary: 0 };
          const d2 = monthlyData[idx2] || { revenue: 0, expense: 0, returns: 0, salary: 0 };
          
          setMetrics1({
            revenue: d1.revenue,
            expense: d1.expense,
            returns: d1.returns,
            salary: d1.salary,
            netProfit: d1.revenue - d1.expense - d1.returns - d1.salary,
            count: 0,
          });
          setMetrics2({
            revenue: d2.revenue,
            expense: d2.expense,
            returns: d2.returns,
            salary: d2.salary,
            netProfit: d2.revenue - d2.expense - d2.returns - d2.salary,
            count: 0,
          });
          setLabel1(getArabicMonth(idx1));
          setLabel2(getArabicMonth(idx2));
        } else if (mode === 'YEARS') {
          const startY1 = `${year1}-01-01`;
          const endY1 = `${year1}-12-31`;
          const startY2 = `${year2}-01-01`;
          const endY2 = `${year2}-12-31`;

          const m1 = await getPeriodFinancialMetrics(startY1, endY1);
          const m2 = await getPeriodFinancialMetrics(startY2, endY2);
          setMetrics1(m1);
          setMetrics2(m2);
          setLabel1(`سنة ${year1}`);
          setLabel2(`سنة ${year2}`);
        }
      } catch (err) {
        console.error('Error fetching comparison:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mode, day1, day2, range1Start, range1End, range2Start, range2End, month1, month2, year1, year2, monthlyData]);

  // Items
  const items = [
    {
      key: 'revenue',
      label: 'الإيرادات',
      v1: metrics1.revenue,
      v2: metrics2.revenue,
      change: calculatePercentageChange(metrics2.revenue, metrics1.revenue),
      isGoodWhenHigher: true,
    },
    {
      key: 'expense',
      label: 'النفقات',
      v1: metrics1.expense,
      v2: metrics2.expense,
      change: calculatePercentageChange(metrics2.expense, metrics1.expense),
      isGoodWhenHigher: false,
    },
    {
      key: 'returns',
      label: 'المسترجعات',
      v1: metrics1.returns,
      v2: metrics2.returns,
      change: calculatePercentageChange(metrics2.returns, metrics1.returns),
      isGoodWhenHigher: false,
    },
    {
      key: 'salary',
      label: 'رواتب الموظفين',
      v1: metrics1.salary,
      v2: metrics2.salary,
      change: calculatePercentageChange(metrics2.salary, metrics1.salary),
      isGoodWhenHigher: false,
    },
    {
      key: 'netProfit',
      label: 'صافي الربح',
      v1: metrics1.netProfit,
      v2: metrics2.netProfit,
      change: calculatePercentageChange(metrics2.netProfit, metrics1.netProfit),
      isGoodWhenHigher: true,
    },
  ];

  const netProfitChange = calculatePercentageChange(metrics2.netProfit, metrics1.netProfit);
  const isNetProfitPositive = netProfitChange >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">المقارنات المالية والتحليل المقارن</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          قارن بين أي يومين، فترتين، شهرين أو سنتين في النظام مع التحليل المالي
        </p>
      </div>

      {/* Clean Mode Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-1.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          <button
            onClick={() => setMode('DAYS')}
            className={`py-2 px-3 text-xs font-bold rounded transition-colors ${
              mode === 'DAYS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            مقارنة بالأيام (يوم / يوم)
          </button>
          <button
            onClick={() => setMode('RANGES')}
            className={`py-2 px-3 text-xs font-bold rounded transition-colors ${
              mode === 'RANGES'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            مقارنة بنطاق فترتين
          </button>
          <button
            onClick={() => setMode('MONTHS')}
            className={`py-2 px-3 text-xs font-bold rounded transition-colors ${
              mode === 'MONTHS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            مقارنة بالشهور
          </button>
          <button
            onClick={() => setMode('YEARS')}
            className={`py-2 px-3 text-xs font-bold rounded transition-colors ${
              mode === 'YEARS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            مقارنة بالسنوات
          </button>
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 shadow-xs">
        {mode === 'DAYS' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">اليوم الأول (الفترة 1)</label>
              <input
                type="date"
                value={day1}
                onChange={(e) => setDay1(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">اليوم الثاني (الفترة 2)</label>
              <input
                type="date"
                value={day2}
                onChange={(e) => setDay2(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        )}

        {mode === 'RANGES' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-md border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">الفترة الأولى (البداية والنهاية)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={range1Start}
                    onChange={(e) => setRange1Start(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={range1End}
                    onChange={(e) => setRange1End(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-md border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">الفترة الثانية (البداية والنهاية)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={range2Start}
                    onChange={(e) => setRange2Start(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={range2End}
                    onChange={(e) => setRange2End(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'MONTHS' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الشهر الأول (الفترة 1)</label>
              <select
                value={month1}
                onChange={(e) => setMonth1(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={String(i)}>{getArabicMonth(i)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الشهر الثاني (الفترة 2)</label>
              <select
                value={month2}
                onChange={(e) => setMonth2(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={String(i)}>{getArabicMonth(i)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {mode === 'YEARS' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">السنة الأولى (الفترة 1)</label>
              <input
                type="number"
                min="2020"
                max="2035"
                value={year1}
                onChange={(e) => setYear1(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">السنة الثانية (الفترة 2)</label>
              <input
                type="number"
                min="2020"
                max="2035"
                value={year2}
                onChange={(e) => setYear2(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Output Results */}
      {loading ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
          <p className="text-xs font-semibold text-slate-500">جاري احتساب البيانات المباشرة للمقارنة...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Executive KPI Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الفترة الأولى ({label1})</span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold">
                  {metrics1.count > 0 ? `${metrics1.count} فاتورة` : 'فترة أساسية'}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(metrics1.netProfit)}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">صافي ربح الفترة الأولى</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الفترة الثانية ({label2})</span>
                {netProfitChange !== 0 && (
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${
                    isNetProfitPositive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300'
                  }`}>
                    {netProfitChange > 0 ? '+' : ''}{netProfitChange.toFixed(1)}% {isNetProfitPositive ? 'نمو بالأرباح' : 'انخفاض'}
                  </span>
                )}
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(metrics2.netProfit)}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">صافي ربح الفترة المقارنة</p>
            </div>
          </div>

          {/* Clean Data Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">تفاصيل المقارنة المالية</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مقارنة تفصيلية لكل بند مالي بين الفترتين المحددتين</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                {label1} ⚡ {label2}
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-right border-collapse text-xs min-w-[680px]">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold uppercase whitespace-nowrap">
                    <th className="py-3.5 px-4 min-w-[140px]">البند المالي</th>
                    <th className="py-3.5 px-4 min-w-[130px]">{label1}</th>
                    <th className="py-3.5 px-4 min-w-[130px]">{label2}</th>
                    <th className="py-3.5 px-4 text-center min-w-[120px]">نسبة التغير (%)</th>
                    <th className="py-3.5 px-4 text-center min-w-[160px]">المؤشر البصري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 whitespace-nowrap">
                  {items.map((item) => {
                    const isPositiveChange = item.isGoodWhenHigher ? item.change >= 0 : item.change <= 0;
                    const maxVal = Math.max(Math.abs(item.v1), Math.abs(item.v2), 1);
                    const pct1 = Math.min(Math.round((Math.abs(item.v1) / maxVal) * 100), 100);
                    const pct2 = Math.min(Math.round((Math.abs(item.v2) / maxVal) * 100), 100);

                    return (
                      <tr key={item.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {item.label}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(item.v1)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(item.v2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.v1 === 0 && item.v2 === 0 ? (
                            <span className="text-slate-400 font-semibold">—</span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-extrabold text-xs border ${
                              isPositiveChange
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800/60'
                                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800/60'
                            }`}>
                              {item.change > 0 ? '↑ +' : '↓ '}{item.change.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-0.5">
                              <span>{pct1}% ({label1})</span>
                              <span>{pct2}% ({label2})</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex gap-0.5 p-0.5">
                              <div className="bg-rose-500/80 dark:bg-rose-500/70 h-full rounded-full transition-all duration-500" style={{ width: `${pct1}%` }} title={`${label1}: ${pct1}%`} />
                              <div className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct2}%` }} title={`${label2}: ${pct2}%`} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Executive Financial Report Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-1-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75M15 6v6.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    التقرير المالي المقارن التحليلي
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ملخص وتوصيات مقارنة <span className="font-bold text-slate-700 dark:text-slate-200">{label1}</span> مقابل <span className="font-bold text-slate-700 dark:text-slate-200">{label2}</span>
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700">
                تقرير آلي معتمد
              </span>
            </div>

            {/* Structured Report Bullet Points Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Revenue Card */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-md p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 005.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                    الإيرادات المالية
                  </span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    metrics2.revenue >= metrics1.revenue ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}>
                    {metrics2.revenue >= metrics1.revenue ? 'نمو' : 'انخفاض'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1.5">
                  سجلت الإيرادات في <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-extrabold border border-blue-200 dark:border-blue-800/60">{label2}</span> مبلغ <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800/80">{formatCurrency(metrics2.revenue)}</span> مقارنة بـ <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold border border-slate-300 dark:border-slate-700">{formatCurrency(metrics1.revenue)}</span> في <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-extrabold border border-blue-200 dark:border-blue-800/60">{label1}</span>، بفارق قدره <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-800/80">{formatCurrency(Math.abs(metrics2.revenue - metrics1.revenue))}</span>.
                </p>
              </div>

              {/* Expenses Card */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-md p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-rose-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.511l-5.511-3.181" />
                    </svg>
                    النفقات والالتزامات
                  </span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    metrics2.expense + metrics2.returns + metrics2.salary <= metrics1.expense + metrics1.returns + metrics1.salary
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}>
                    {metrics2.expense + metrics2.returns + metrics2.salary <= metrics1.expense + metrics1.returns + metrics1.salary ? 'تحكم أفضل' : 'ارتفاع'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1.5">
                  بلغت النفقات التراكمية في <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-extrabold border border-blue-200 dark:border-blue-800/60">{label2}</span> ما قيمته <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 font-extrabold border border-rose-300 dark:border-rose-800/80">{formatCurrency(metrics2.expense + metrics2.returns + metrics2.salary)}</span> مقارنة بـ <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold border border-slate-300 dark:border-slate-700">{formatCurrency(metrics1.expense + metrics1.returns + metrics1.salary)}</span> في <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-extrabold border border-blue-200 dark:border-blue-800/60">{label1}</span>.
                </p>
              </div>
            </div>

            {/* Net Profit Conclusion Highlight Box */}
            <div className={`p-4 rounded-md border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isNetProfitPositive
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                : 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
            }`}>
              <div className="space-y-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isNetProfitPositive ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                  النتيجة النهائية للمقارنة المالية (صافي الربح)
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed pt-0.5">
                  حققت المنصة صافي ربح قدره <span className="inline-block px-2 py-0.5 mx-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 font-extrabold text-sm border border-emerald-300 dark:border-emerald-800">{formatCurrency(metrics2.netProfit)}</span> في <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-extrabold border border-blue-200 dark:border-blue-800/60">{label2}</span> مقابل <span className="inline-block px-2 py-0.5 mx-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-sm border border-slate-300 dark:border-slate-700">{formatCurrency(metrics1.netProfit)}</span> في <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-extrabold border border-blue-200 dark:border-blue-800/60">{label1}</span>.
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`inline-flex items-center gap-1 text-sm font-extrabold px-3 py-1.5 rounded-md border ${
                  isNetProfitPositive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'bg-red-600 text-white border-red-500 shadow-xs'
                }`}>
                  {netProfitChange >= 0 ? '↑ +' : '↓ '}{netProfitChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
