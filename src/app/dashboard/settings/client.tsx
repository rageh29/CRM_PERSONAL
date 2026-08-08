'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/providers/ToastProvider';

const MAX_LOGO_SIZE_MB = 5;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserEmail = session?.user?.email || '';
  const isMasterAdmin = Boolean((session?.user as any)?.isMasterAdmin || (session?.user as any)?.role === 'MASTER_ADMIN');

  const [logoPreview, setLogoPreview] = useState<string | null>(settings?.companyLogo || null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null); // new logo to send
  const [logoRemoved, setLogoRemoved] = useState(false);

  const [form, setForm] = useState({
    companyName: (isMasterAdmin && (!settings?.companyName || settings?.companyName === session?.user?.name || settings?.companyName === 'نظام ايرور المحاسبي' || settings?.companyName === 'شركتي'))
      ? 'High System'
      : (settings?.companyName || (isMasterAdmin ? 'High System' : 'متجري')),
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

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({ type: 'error', message: 'يرجى اختيار ملف صورة فقط (PNG, JPG, WEBP)' });
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      showToast({ type: 'error', message: `حجم الشعار يجب أن لا يتجاوز ${MAX_LOGO_SIZE_MB} ميجابايت` });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      setLogoBase64(base64);
      setLogoRemoved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoBase64(null);
    setLogoRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
      const payload: any = { ...form };

      // Upload logo to Cloudinary if a new image was selected
      if (logoBase64) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: logoBase64, folder: 'merchant_logos' }),
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.error || 'فشل رفع الشعار إلى Cloudinary');
        }

        const uploadData = await uploadRes.json();
        payload.companyLogo = uploadData.url;
      } else if (logoRemoved) {
        payload.companyLogo = '';
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        showToast({ type: 'success', message: 'تم حفظ وتحديث الإعدادات بنجاح' });
        setForm((prev) => ({ ...prev, adminPassword: '', confirmPassword: '' }));
        setLogoBase64(null);
        setLogoRemoved(false);
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
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تحديث البريد وكلمة المرور وشعار المتجر</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-md p-3.5 text-xs text-center font-bold animate-fade-in">
            {error}
          </div>
        )}

        {/* Section: Logo Upload (Available for all) */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
              </svg>
              شعار {isMasterAdmin ? 'المنصة الرئيسي' : 'المتجر'} (اللوجو)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ارفع الشعار ليظهر في القائمة الجانبية. الحد الأقصى {MAX_LOGO_SIZE_MB} ميجابايت (PNG, JPG, WEBP)
            </p>
          </div>

          <div className="flex items-center gap-5">
            {/* Logo Preview */}
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="شعار المتجر"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21zM16.5 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoSelect}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md cursor-pointer transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                {logoPreview ? 'تغيير الشعار' : 'رفع شعار'}
              </label>

              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  حذف الشعار
                </button>
              )}

              <span className="text-[10px] text-slate-400">
                الحد الأقصى: {MAX_LOGO_SIZE_MB} ميجابايت
              </span>
            </div>
          </div>
        </div>

        {/* Section: Store / Platform Name */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.25a.75.75 0 0 1-.75-.75V4.5a.75.75 0 0 1 .75-.75h19.5a.75.75 0 0 1 .75.75v15.75a.75.75 0 0 1-.75.75H13.5Z" />
              </svg>
              {isMasterAdmin ? 'اسم المنصة (السايد بار والتقارير)' : 'اسم المتجر '}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تغيير الاسم الذي يظهر في القائمة الجانبية والفواتير
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isMasterAdmin ? 'اسم المنصة الرئيسي' : 'اسم المتجر'}
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
              placeholder={isMasterAdmin ? 'High System' : 'اسم متجرك'}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 transition-all font-semibold"
            />
          </div>
        </div>

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

        {/* Section: Reset Demo Data */}
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-md border border-rose-200 dark:border-rose-900/50 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-rose-200 dark:border-rose-900/50 pb-3">
            <h2 className="text-sm font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              تفريغ وحذف البيانات التجريبية
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              مسح جميع الفواتير والموظفين التجريبية لتجهيز حسابك للبيانات الحقيقية
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors"
          >
            مسح البيانات التجريبية
          </button>
        </div>

        {/* Save Admin Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? 'جاري حفظ التغييرات...' : 'حفظ جميع التغييرات'}
        </button>
      </form>
    </div>
  );
}
