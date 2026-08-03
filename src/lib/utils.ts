// ═══════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════

// Simple clsx-like utility (no external dep needed)
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  const formatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount).replace(/ر\.س\./g, 'ر.س').replace(/ر\.س/g, 'ر.س');
}

// Format date in Arabic
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

// Format short date
export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return formatShortDate(d);
}

// Generate invoice number
export function generateInvoiceNumber(count: number): string {
  const year = new Date().getFullYear();
  const padded = String(count + 1).padStart(5, '0');
  return `INV-${year}-${padded}`;
}

// Category labels in Arabic
export const CATEGORY_LABELS: Record<string, string> = {
  REVENUE: 'إيرادات',
  EXPENSE: 'نفقات',
  RETURN: 'مسترجعات',
  SALARY: 'رواتب موظفين',
};

// Category colors
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  REVENUE: { bg: 'bg-revenue-bg', text: 'text-revenue', dot: 'bg-revenue' },
  EXPENSE: { bg: 'bg-expense-bg', text: 'text-expense', dot: 'bg-expense' },
  RETURN: { bg: 'bg-return-bg', text: 'text-return', dot: 'bg-return' },
  SALARY: { bg: 'bg-salary-bg', text: 'text-salary', dot: 'bg-salary' },
};

// Currency labels
export const CURRENCY_LABELS: Record<string, string> = {
  SAR: 'ريال سعودي',
  USD: 'دولار أمريكي',
};

// Role labels
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'سوبر أدمن',
  ADMIN: 'أدمن',
  DATA_ENTRY: 'مدخل بيانات',
  VIEWER: 'مشاهد',
};

// Action labels
export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'إنشاء',
  UPDATE: 'تعديل',
  DELETE: 'حذف',
  LOGIN: 'تسجيل دخول',
  LOGOUT: 'تسجيل خروج',
  PRINT: 'طباعة',
  EXPORT: 'تصدير',
};

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Get month name in Arabic
export function getArabicMonth(month: number): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  return months[month] || '';
}
