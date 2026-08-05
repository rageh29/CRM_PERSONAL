'use client';

import { useState } from 'react';
import { formatCurrency, CATEGORY_LABELS, formatShortDate, printHtml } from '@/lib/utils';

export function ReportsClient({ invoices }: { invoices: any[] }) {
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const filtered = invoices.filter((inv) => {
    const d = new Date(inv.date);
    const matchCat = !category || inv.category === category;
    const matchMonth = d.getMonth() + 1 === parseInt(month);
    const matchYear = d.getFullYear() === parseInt(year);
    return matchCat && matchMonth && matchYear;
  });

  const total = filtered.reduce((a, i) => a + i.amount, 0);

  const handlePrintAll = () => {
    const rows = filtered.map((inv) => `
      <tr>
        <td>${inv.invoiceNumber}</td>
        <td>${inv.name}</td>
        <td>${CATEGORY_LABELS[inv.category]}</td>
        <td>${formatCurrency(inv.amount, inv.currency)}</td>
        <td>${formatShortDate(inv.date)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الفواتير</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #0f172a; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 22px; font-weight: 800; color: #0f172a; }
          .sub { font-size: 12px; color: #475569; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { text-align: right; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; font-size: 12px; }
          td { padding: 10px; border: 1px solid #e2e8f0; font-size: 12px; }
          .total { text-align: left; margin-top: 20px; font-size: 18px; font-weight: 800; color: #0f172a; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">نظام ايرور المحاسبي</div>
          <div class="sub">تقرير الفواتير — ${filtered.length} فاتورة (شهر ${month} / ${year})</div>
        </div>
        <table>
          <thead><tr><th>رقم الفاتورة</th><th>الاسم</th><th>التصنيف</th><th>المبلغ</th><th>التاريخ</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">الإجمالي: ${formatCurrency(total)}</div>
        <div class="footer">تم إنشاء هذا التقرير بواسطة نظام ايرور المحاسبي</div>
      </body>
      </html>
    `;
    printHtml(htmlContent);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">التقارير المالية والطباعة</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">فلترة وتجميع الفواتير وتصدير تقارير رسمية بهوية الشركة</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">كل التصنيفات</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>شهر {i + 1}</option>
            ))}
          </select>

          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2020"
            max="2035"
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          />

          <button
            onClick={handlePrintAll}
            disabled={filtered.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors disabled:opacity-50"
          >
            طباعة التقرير التجميعي
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">عدد الفواتير المحددة</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{filtered.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">إجمالي المبلغ في التقرير</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Clean Corporate Table */}
      {filtered.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-right border-collapse text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold uppercase whitespace-nowrap">
                  <th className="py-3.5 px-4">رقم الفاتورة</th>
                  <th className="py-3.5 px-4">اسم الفاتورة</th>
                  <th className="py-3.5 px-4">التصنيف</th>
                  <th className="py-3.5 px-4">المبلغ</th>
                  <th className="py-3.5 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 whitespace-nowrap">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white text-left" dir="ltr">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {inv.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {CATEGORY_LABELS[inv.category]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(inv.amount, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {formatShortDate(inv.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-slate-500 text-xs font-medium">
          لا توجد فواتير مطابقة للفترة والتصنيف المحدد
        </div>
      )}
    </div>
  );
}
