import { getInvoices } from '@/features/invoices/actions';
import { InvoiceList } from '@/features/invoices/InvoiceList';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InvoicesPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string || 'EMPLOYEE';
  const userPermissions = (session?.user as any)?.permissions || [];
  const invoices = await getInvoices();

  const serialized = invoices.map((inv: any) => ({
    ...inv,
    date: inv.date.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">إدارة الفواتير السجل المالي</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{invoices.length} فاتورة مسجلة</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
        >
          + فاتورة جديدة
        </Link>
      </div>
      <InvoiceList invoices={serialized} userRole={userRole} userPermissions={userPermissions} />
    </div>
  );
}
