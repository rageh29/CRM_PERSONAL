// ═══════════════════════════════════════
// Type Definitions & Dynamic Permissions
// ═══════════════════════════════════════

export type UserRole = 'SUPER_ADMIN' | 'EMPLOYEE';
export type InvoiceCategory = 'REVENUE' | 'EXPENSE' | 'RETURN' | 'SALARY';
export type Currency = 'SAR' | 'USD';
export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PRINT' | 'EXPORT';

export interface PermissionItem {
  id: string;
  label: string;
  desc: string;
  category: 'الفواتير' | 'الموظفين' | 'التقارير والإعدادات';
}

export const ALL_PERMISSIONS: PermissionItem[] = [
  { id: 'invoices:view', label: 'عرض الفواتير والداشبورد', desc: 'تصفح لوحة التحكم وقائمة الفواتير والمعاينات', category: 'الفواتير' },
  { id: 'invoices:create', label: 'إنشاء فاتورة جديدة', desc: 'إضافة فواتير جديدة بجميع التصنيفات', category: 'الفواتير' },
  { id: 'invoices:edit', label: 'تعديل الفواتير', desc: 'تعديل بيانات الفواتير المسجلة', category: 'الفواتير' },
  { id: 'invoices:delete', label: 'حذف الفواتير', desc: 'حذف الفواتير من النظام', category: 'الفواتير' },
  
  { id: 'employees:manage', label: 'إدارة الموظفين والرواتب', desc: 'إضافة وتعديل وحذف الموظفين وتتبع الرواتب', category: 'الموظفين' },
  
  { id: 'reports:export', label: 'الطباعة وتصدير التقارير', desc: 'طباعة الفواتير الفردية والمجمعة وتصدير التقارير', category: 'التقارير والإعدادات' },
  { id: 'activity:view', label: 'عرض سجل النشاط', desc: 'استعراض كل ما تم في النظام ومن قام به', category: 'التقارير والإعدادات' },
  { id: 'settings:manage', label: 'تعديل إعدادات النظام', desc: 'تحديث بيانات الشركة والشعار والألوان', category: 'التقارير والإعدادات' },
  { id: 'users:manage', label: 'إدارة المستخدمين والصلاحيات', desc: 'إضافة المستخدمين وتخصيص الصلاحيات لهم', category: 'التقارير والإعدادات' },
];

export interface DashboardStats {
  totalRevenue: number;
  totalExpense: number;
  totalReturn: number;
  totalSalary: number;
  netProfit: number;
  invoiceCount: number;
  revenueChange: number;
  expenseChange: number;
  returnChange: number;
  salaryChange: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expense: number;
  returns: number;
  salary: number;
}

export interface ComparisonResult {
  period1: { label: string; revenue: number; expense: number; returns: number; salary: number; net: number };
  period2: { label: string; revenue: number; expense: number; returns: number; salary: number; net: number };
  changes: { revenue: number; expense: number; returns: number; salary: number; net: number };
}

export interface BestWorstMonth {
  best: { month: string; amount: number };
  worst: { month: string; amount: number };
}

// Permission checking helper
export function hasPermission(
  userRole: string,
  userPermissions: string[] | string,
  requiredPermission: string
): boolean {
  if (userRole === 'SUPER_ADMIN' || userRole === 'MASTER_ADMIN' || requiredPermission === '*') return true;

  let perms: string[] = [];
  if (Array.isArray(userPermissions)) {
    perms = userPermissions;
  } else if (typeof userPermissions === 'string') {
    try {
      perms = JSON.parse(userPermissions);
    } catch {
      perms = [];
    }
  }

  if (perms.includes('ALL')) return true;

  // Basic view permission is granted if they have any permission or explicit invoices:view
  if (requiredPermission === 'view' || requiredPermission === 'invoices:view') {
    return perms.includes('invoices:view') || perms.length > 0;
  }

  return perms.includes(requiredPermission);
}
