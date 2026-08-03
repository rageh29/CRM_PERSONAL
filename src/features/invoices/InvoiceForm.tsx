'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice, updateInvoice } from '@/features/invoices/actions';
import { CATEGORY_LABELS, CURRENCY_LABELS } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';

interface InvoiceFormProps {
  invoice?: any;
  employees?: { id: string; name: string; position: string }[];
  mode?: 'create' | 'edit';
}

export function InvoiceForm({ invoice, employees = [], mode = 'create' }: InvoiceFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: invoice?.name || '',
    amount: invoice?.amount || '',
    description: invoice?.description || '',
    category: invoice?.category || 'EXPENSE',
    currency: invoice?.currency || 'SAR',
    date: invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    employeeId: invoice?.employeeId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...form,
        amount: parseFloat(String(form.amount)) || 0,
        employeeId: form.employeeId || undefined,
      };

      if (mode === 'edit' && invoice) {
        await updateInvoice(invoice.id, data);
        showToast({ type: 'success', message: 'تم تحديث بيانات الفاتورة بنجاح' });
      } else {
        await createInvoice(data);
        showToast({ type: 'success', message: 'تم إنشاء الفاتورة الجديدة بنجاح' });
      }

      router.push('/dashboard/invoices');
      router.refresh();
    } catch (err: any) {
      const msg = err.message || 'حدث خطأ أثناء حفظ الفاتورة';
      setError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-md shadow-xs">
      <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
        {mode === 'edit' ? 'تعديل بيانات الفاتورة' : 'إضافة فاتورة جديدة'}
      </h2>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-md p-3 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          اسم الفاتورة <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder=""
          required
          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
        />
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            المبلغ <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            required
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">العملة</label>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
          >
            {Object.entries(CURRENCY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          التصنيف المالي <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setForm({ ...form, category: key, employeeId: key !== 'SALARY' ? '' : form.employeeId })}
              className={`py-2 px-3 text-xs font-bold rounded-md border transition-all ${
                form.category === key
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* If SALARY category selected, show Employee dropdown */}
      {form.category === 'SALARY' && (
        <div className="bg-purple-50/50 dark:bg-purple-950/30 p-3.5 rounded-md border border-purple-200 dark:border-purple-900 space-y-1.5 animate-fade-in">
          <label className="block text-xs font-bold text-purple-900 dark:text-purple-300">
            ربط الفاتورة بالموظف المستحق
          </label>
          <select
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-md text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="">اختيار الموظف (اختياري)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name} — ({emp.position})</option>
            ))}
          </select>
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">تاريخ الفاتورة</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الوصف والتفاصيل</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="إضافة تفاصيل وملاحظات اختيارية..."
          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md hover:bg-slate-200 transition-colors"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : mode === 'edit' ? 'تحديث الفاتورة' : 'إنشاء الفاتورة'}
        </button>
      </div>
    </form>
  );
}
