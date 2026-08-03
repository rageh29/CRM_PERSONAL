'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/providers/ToastProvider';

export function SettingsClient({ settings }: { settings: any }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const currentUserEmail = session?.user?.email || '';

  const [form, setForm] = useState({
    companyName: settings?.companyName || 'شركتي',
    primaryColor: settings?.primaryColor || '#2563eb',
    secondaryColor: settings?.secondaryColor || '#7c3aed',
    contactEmail: settings?.contactEmail || '',
    contactPhone: settings?.contactPhone || '',
    contactAddress: settings?.contactAddress || '',
    defaultCurrency: settings?.defaultCurrency || 'SAR',
    adminEmail: currentUserEmail,
    adminPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.adminPassword && form.adminPassword !== form.confirmPassword) {
      const msg = 'كلمة المرور وتأكيد كلمة المرور غير متطابقين';
      setError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    if (form.adminPassword && form.adminPassword.length < 6) {
      const msg = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      setError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل في حفظ الإعدادات');
      }

      const passwordWasChanged = !!form.adminPassword;
      if (passwordWasChanged) {
        showToast({ type: 'success', message: 'تم تحديث كلمة المرور بنجاح! جاري تسجيل الخروج لإعادة الدخول بكلمة المرور الجديدة...' });
        setForm((prev) => ({ ...prev, adminPassword: '', confirmPassword: '' }));
        setTimeout(() => {
          signOut({ callbackUrl: '/login' });
        }, 1500);
      } else {
        showToast({ type: 'success', message: 'تم حفظ وتحديث بيانات حساب السوبر أدمن بنجاح' });
        setForm((prev) => ({ ...prev, adminPassword: '', confirmPassword: '' }));
        router.refresh();
      }
    } catch (err: any) {
      const msg = err.message || 'حدث خطأ أثناء الحفظ';
      setError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemoData = async () => {
    setResetLoading(true);
    setError('');

    try {
      const res = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل في حذف البيانات التجريبية');
      }

      const data = await res.json();
      showToast({
        type: 'success',
        message: data.message || 'تم حذف كافة البيانات التجريبية بنجاح، والإبقاء على حساب السوبر أدمن فقط',
      });
      setShowResetModal(false);
      router.refresh();
    } catch (err: any) {
      const msg = err.message || 'حدث خطأ أثناء مسح البيانات التجريبية';
      setError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    setSeedLoading(true);
    setError('');

    try {
      const res = await fetch('/api/settings/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل في توليد البيانات التجريبية');
      }

      const data = await res.json();
      showToast({
        type: 'success',
        message: data.message || 'تم إعادة إنشاء البيانات التجريبية بنجاح!',
      });
      setShowSeedModal(false);
      router.refresh();
    } catch (err: any) {
      const msg = err.message || 'حدث خطأ أثناء إنشاء البيانات التجريبية';
      setError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="تأكيد تفريغ وحذف البيانات التجريبية"
        message="هل أنت أصلك متأكد من مسح جميع الفواتير والموظفين من النظام؟ هذه العملية تنظف المنصة وتجهزها لبياناتك الحقيقية، ولن تؤثر على حسابك الإداري."
        confirmText={resetLoading ? 'جاري المسح...' : 'نعم، امسح كافة البيانات'}
        cancelText="إلغاء الإجراء"
        type="danger"
        onConfirm={handleResetDemoData}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Confirm Seed Modal */}
      <ConfirmModal
        isOpen={showSeedModal}
        title="تأكيد إعادة إنشاء البيانات التجريبية"
        message="هل تريد إعادة إنشاء وتوليد فواتير وموظفين وسجلات تجريبية جديدة؟ سيتم إضافة بيانات تجريبية متنوعة لتجربة التقارير والرسوم البيانية."
        confirmText={seedLoading ? 'جاري التوليد...' : 'نعم، أعد إنشاء البيانات التجريبية'}
        cancelText="إلغاء الإجراء"
        type="info"
        onConfirm={handleSeedDemoData}
        onCancel={() => setShowSeedModal(false)}
      />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">إعدادات الحساب والنظام</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تحديث البريد وكلمة المرور وحذف البيانات التجريبية</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-md p-3.5 text-xs text-center font-bold animate-fade-in">
            {error}
          </div>
        )}

        {/* Section 1: Super Admin Credentials */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              بيانات حساب السوبر أدمن (Super Admin)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تحديث البريد الإلكتروني وكلمة المرور لحسابك الإداري</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                البريد الإلكتروني الحساب الإداري
              </label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
                dir="ltr"
                placeholder="admin@shahrani.com"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600 transition-all text-left font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                كلمة المرور الجديدة <span className="text-slate-400 font-normal">(اتركها فارغة إذا لم تُرِد التغيير)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.adminPassword}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  minLength={6}
                  dir="ltr"
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600 transition-all text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.274-4.057 5.064-7 9.544-7s8.27 2.943 9.543 7c-1.274 4.057-5.064 7-9.543 7s-8.27-2.943-9.543-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {form.adminPassword && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required={!!form.adminPassword}
                    minLength={6}
                    dir="ltr"
                    placeholder="••••••••"
                    className="w-full pr-10 pl-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600 transition-all text-left font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.274-4.057 5.064-7 9.544-7s8.27 2.943 9.543 7c-1.274 4.057-5.064 7-9.543 7s-8.27-2.943-9.543-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Admin Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? 'جاري حفظ التغييرات...' : 'حفظ تغييرات الحساب الإداري'}
        </button>
      </form>

      {/* Data Management Section */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 sm:p-6 space-y-4 mt-8">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            إدارة البيانات والعمليات التجريبية
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            يمكنك تفريغ النظام وحذف البيانات التجريبية للبدء بصفحة بيضاء لبياناتك الحقيقية، أو إعادة إنشاء بيانات تجريبية جديدة في أي وقت لتجربة التقارير والرسوم البيانية.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            اختر العملية المطلوبة:
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowSeedModal(true)}
              disabled={seedLoading || resetLoading}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
               إعادة إنشاء البيانات التجريبية
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              disabled={resetLoading || seedLoading}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              حذف البيانات التجريبية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
