'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerMerchantStore } from '@/features/auth/registerActions';
import logoLight from '@/assets/logo-light.png';
import logoNight from '@/assets/logo-night.png';

export default function RegisterPage() {
  const router = useRouter();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await registerMerchantStore({
        storeName,
        ownerName,
        phone,
        email,
        password,
        activationCode,
      });

      setSuccess(`تم تسجيل وتفعيل متجر "${res.storeName}" بنجاح! جاري تسجيل الدخول...`);

      // Auto sign in
      const authRes = await signIn('credentials', {
        email: res.email,
        password,
        redirect: false,
      });

      if (authRes?.error) {
        router.push('/login?registered=true');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل وتفعيل الكود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src={logoLight}
              alt="شعار المنصة"
              height={56}
              className="h-14 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src={logoNight}
              alt="شعار المنصة"
              height={56}
              className="h-14 w-auto object-contain hidden dark:block drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            تسجيل متجر جديد وتفعيل الاشتراكات
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            أنشئ حساب متجرك وادخل كود التفعيل للبدء في استخدام النظام المحاسبي
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm" dir="rtl">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم المتجر / الشركة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثال: متجر الأمل التجاري"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم التاجر / المستخدم <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="مثال: عبد الله أحمد"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الجوال
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966500000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@store.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                كلمة المرور <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Activation Code Highlighted Box */}
            <div className="pt-2">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-500/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔑</span>
                  <label className="block text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                    كود التفعيل والاشتراك <span className="text-rose-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  placeholder="ادخل كود التفعيل مثل: ERR-XXXX-XXXX"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-base font-mono font-bold tracking-widest text-emerald-900 dark:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-xs"
                />
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold">
                  تحصل على كود التفعيل عند الشراء من إدارة المنصة.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'جاري تفعيل الحساب والاشتراك...' : 'إنشاء الحساب وتفعيل المتجر فوراً'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
              تسجيل الدخول
            </Link>
          </div>
        </div>

        <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mt-6">
          نظام ايرور المحاسبي © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
