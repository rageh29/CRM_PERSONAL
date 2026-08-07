'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { renewStoreWithCode } from '@/features/auth/registerActions';

export default function SubscriptionExpiredPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError('تعذر التعرف على حساب المتجر، يرجى إعادة تسجيل الدخول');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await renewStoreWithCode(tenantId, code);
      setSuccess('تم تمديد وتجديد اشتراك المتجر بنجاح! جاري توجيهك للوحة التحكم...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'فشل تجديد الاشتراك بكود التفعيل المدخل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md text-center space-y-5" dir="rtl">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
            ⌛
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              اشتراك المتجر انتهى أو غير مفعل
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              انتهت فترة التفعيل الخاصة بمتجرك. أدخل كود تفعيل جديد لتمديد الاشتراك ومتابعة العمل فوراً.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleRenew} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                كود التفعيل الجديد <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ERR-XXXX-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-base font-mono font-bold tracking-widest text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-xs text-center"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'جاري تفعيل الكود والتجديد...' : 'تجديد الاشتراك ومتابعة العمل'}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              تسجيل الخروج والعودة لصفحة الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
