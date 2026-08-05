'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteInvoice } from '@/features/invoices/actions';
import { formatCurrency, formatShortDate, CATEGORY_LABELS, CURRENCY_LABELS, printHtml } from '@/lib/utils';
import { hasPermission } from '@/lib/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/providers/ToastProvider';

interface InvoiceListProps {
  invoices: any[];
  userRole: string;
  userPermissions?: string[] | string;
}

const categoryBadge: Record<string, string> = {
  REVENUE: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  EXPENSE: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  RETURN: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  SALARY: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
};

const ITEMS_PER_PAGE = 20;

export function InvoiceList({ invoices, userRole, userPermissions = [] }: InvoiceListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const canEdit = hasPermission(userRole, userPermissions, 'invoices:edit');
  const canDelete = hasPermission(userRole, userPermissions, 'invoices:delete');

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchSearch = !search || 
          inv.name.toLowerCase().includes(search.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
        const matchCategory = !categoryFilter || inv.category === categoryFilter;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [invoices, search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const validPage = Math.min(currentPage, totalPages);

  const paginatedInvoices = useMemo(() => {
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, validPage]);

  const startIndex = (validPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(validPage * ITEMS_PER_PAGE, filtered.length);

  const executeDelete = async () => {
    if (!deletingId) return;
    setLoadingDelete(true);
    try {
      await deleteInvoice(deletingId);
      showToast({ type: 'success', message: 'تم حذف الفاتورة بنجاح' });
      setDeletingId(null);
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'حدث خطأ أثناء حذف الفاتورة' });
    } finally {
      setLoadingDelete(false);
    }
  };

  const handlePrint = (inv: any) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة ${inv.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 22px; font-weight: 800; color: #0f172a; }
          .info { text-align: left; font-size: 12px; color: #475569; }
          .inv-num { font-size: 14px; font-weight: 700; color: #0f172a; }
          .details { margin: 20px 0; }
          .details table { width: 100%; border-collapse: collapse; }
          .details th { text-align: right; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; }
          .details td { padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
          .total { text-align: left; margin-top: 20px; font-size: 18px; font-weight: 800; color: #0f172a; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">نظام ايرور المحاسبي</div>
          </div>
          <div class="info">
            <div class="inv-num">${inv.invoiceNumber}</div>
            <div>التاريخ: ${formatShortDate(inv.date)}</div>
          </div>
        </div>
        <div class="details">
          <table>
            <tr><th>اسم الفاتورة</th><td>${inv.name}</td></tr>
            <tr><th>التصنيف</th><td>${CATEGORY_LABELS[inv.category] || inv.category}</td></tr>
            <tr><th>المبلغ</th><td>${formatCurrency(inv.amount, inv.currency)}</td></tr>
            <tr><th>العملة</th><td>${CURRENCY_LABELS[inv.currency] || inv.currency}</td></tr>
            ${inv.description ? `<tr><th>الوصف</th><td>${inv.description}</td></tr>` : ''}
            <tr><th>أنشأها</th><td>${inv.createdBy?.name || '-'}</td></tr>
          </table>
        </div>
        <div class="total">الإجمالي: ${formatCurrency(inv.amount, inv.currency)}</div>
        <div class="footer">تم إنشاء هذه الفاتورة بواسطة نظام ايرور المحاسبي</div>
      </body>
      </html>
    `;
    printHtml(htmlContent);
  };

  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="تأكيد حذف الفاتورة"
        message="هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟ سيتم إزالتها نهائياً من السجلات المالية."
        confirmText="نعم، حذف الفاتورة"
        cancelText="إلغاء"
        type="danger"
        loading={loadingDelete}
        onConfirm={executeDelete}
        onCancel={() => setDeletingId(null)}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="بحث بالاسم أو رقم الفاتورة..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none transition-colors"
        >
          <option value="">كل التصنيفات ({invoices.length})</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 text-xs font-medium">
          لا توجد فواتير مطابقة للبحث
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3 w-full max-w-full min-w-0">
            {paginatedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-slate-400 block" dir="ltr text-right">
                      {inv.invoiceNumber}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{inv.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryBadge[inv.category]}`}>
                    {CATEGORY_LABELS[inv.category]}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                    {formatShortDate(inv.date)}
                  </span>
                  <span className={`font-extrabold ${
                    inv.category === 'REVENUE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {inv.category === 'REVENUE' ? '+' : '-'}{formatCurrency(inv.amount, inv.currency)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/dashboard/invoices/${inv.id}`}
                    className="flex-1 text-center py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
                  >
                    عرض
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/dashboard/invoices/${inv.id}/edit`}
                      className="flex-1 text-center py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 rounded border border-emerald-200 dark:border-emerald-800"
                    >
                      تعديل
                    </Link>
                  )}
                  <button
                    onClick={() => handlePrint(inv)}
                    className="flex-1 text-center py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
                  >
                    طباعة
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => setDeletingId(inv.id)}
                      className="px-3 py-1.5 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden w-full max-w-full min-w-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold uppercase">
                    <th className="p-3.5">رقم الفاتورة</th>
                    <th className="p-3.5">اسم الفاتورة</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white" dir="ltr text-right">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{inv.name}</p>
                        {inv.createdBy && <p className="text-[11px] text-slate-500 font-medium">{inv.createdBy.name}</p>}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${categoryBadge[inv.category]}`}>
                          {CATEGORY_LABELS[inv.category]}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className={`font-extrabold text-sm ${
                          inv.category === 'REVENUE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {inv.category === 'REVENUE' ? '+' : '-'}{formatCurrency(inv.amount, inv.currency)}
                        </p>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                        {formatShortDate(inv.date)}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/dashboard/invoices/${inv.id}`}
                            className="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700 transition-colors"
                          >
                            عرض
                          </Link>
                          {canEdit && (
                            <Link
                              href={`/dashboard/invoices/${inv.id}/edit`}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
                            >
                              تعديل
                            </Link>
                          )}
                          <button
                            onClick={() => handlePrint(inv)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700 transition-colors"
                          >
                            طباعة
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => setDeletingId(inv.id)}
                              className="px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/80 rounded-md border border-red-200 dark:border-red-800 transition-colors"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Corporate Pagination Bar */}
          {filtered.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-600 dark:text-slate-400 font-semibold">
                عرض <span className="font-bold text-slate-900 dark:text-white">{startIndex}</span> إلى{' '}
                <span className="font-bold text-slate-900 dark:text-white">{endIndex}</span> من إجمالي{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{filtered.length}</span> فاتورة
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={validPage === 1}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-md font-bold text-xs transition-colors ${
                          p === validPage
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={validPage === totalPages}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
