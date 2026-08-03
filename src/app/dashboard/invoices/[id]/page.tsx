import { getInvoice } from '@/features/invoices/actions';
import { formatCurrency, formatDate, CATEGORY_LABELS, CURRENCY_LABELS } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) notFound();

  const categoryColors: Record<string, string> = {
    REVENUE: 'text-revenue bg-revenue-bg',
    EXPENSE: 'text-expense bg-expense-bg',
    RETURN: 'text-return bg-return-bg',
    SALARY: 'text-salary bg-salary-bg',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{invoice.name}</h1>
          <p className="text-sm text-text-muted mt-1">{invoice.invoiceNumber}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/invoices/${id}/edit`}
            className="px-4 py-2 bg-surface-secondary border border-border text-sm font-medium text-text-secondary rounded-xl hover:bg-surface-hover transition-all"
          >
            تعديل
          </Link>
          <Link
            href="/dashboard/invoices"
            className="px-4 py-2 bg-surface-secondary border border-border text-sm font-medium text-text-secondary rounded-xl hover:bg-surface-hover transition-all"
          >
            رجوع
          </Link>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted mb-1">التصنيف</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${categoryColors[invoice.category]}`}>
              {CATEGORY_LABELS[invoice.category]}
            </span>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">المبلغ</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(invoice.amount, invoice.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">العملة</p>
            <p className="text-sm text-text-primary">{CURRENCY_LABELS[invoice.currency]}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">التاريخ</p>
            <p className="text-sm text-text-primary">{formatDate(invoice.date)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">أنشأها</p>
            <p className="text-sm text-text-primary">{invoice.createdBy.name}</p>
          </div>
          {invoice.employee && (
            <div>
              <p className="text-xs text-text-muted mb-1">الموظف</p>
              <p className="text-sm text-text-primary">{invoice.employee.name} — {invoice.employee.position}</p>
            </div>
          )}
        </div>

        {invoice.description && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-text-muted mb-1">الوصف</p>
            <p className="text-sm text-text-secondary">{invoice.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
