import { getInvoice } from '@/features/invoices/actions';
import { InvoiceForm } from '@/features/invoices/InvoiceForm';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) notFound();

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, name: true, position: true },
  });

  const serialized = {
    ...invoice,
    date: invoice.date.toISOString(),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">تعديل الفاتورة</h1>
        <p className="text-sm text-text-muted mt-1">{invoice.invoiceNumber}</p>
      </div>
      <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-card">
        <InvoiceForm invoice={serialized} employees={employees} mode="edit" />
      </div>
    </div>
  );
}
