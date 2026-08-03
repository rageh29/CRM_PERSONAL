import { InvoiceForm } from '@/features/invoices/InvoiceForm';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, name: true, position: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">فاتورة جديدة</h1>
        <p className="text-sm text-text-muted mt-1">أدخل تفاصيل الفاتورة الجديدة</p>
      </div>
      <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
        <InvoiceForm employees={employees} />
      </div>
    </div>
  );
}
