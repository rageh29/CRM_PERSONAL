'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  generateActivationCodes,
  deleteActivationCode,
  deleteAllUsedCodes,
  toggleTenantStatus,
  extendTenantSubscription,
  deleteTenant,
  updateTenantData,
  updateActivationCodeData,
} from '@/features/master/actions';
import { formatShortDate } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface MasterClientProps {
  data: {
    codes: any[];
    tenants: any[];
    stats: {
      totalCodes: number;
      activeCodes: number;
      usedCodes: number;
      totalTenants: number;
      activeTenants: number;
      totalUsers: number;
    };
  };
}

export function MasterClient({ data }: MasterClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'codes' | 'tenants'>('codes');
  const [loading, setLoading] = useState(false);

  // Generator State
  const [showGenModal, setShowGenModal] = useState(false);
  const [count, setCount] = useState(1);
  const [presetDuration, setPresetDuration] = useState<number>(30); // 30 days default
  const [customDays, setCustomDays] = useState<string>('30');
  const [note, setNote] = useState('');

  // Search & Filters & Pagination
  const ITEMS_PER_PAGE = 10;
  const [codeSearch, setCodeSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState<'all' | 'active' | 'used'>('all');
  const [codePage, setCodePage] = useState(1);

  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantPage, setTenantPage] = useState(1);

  // Delete & Extend Modals State
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<any>(null);
  const [confirmDeleteAllUsed, setConfirmDeleteAllUsed] = useState(false);
  const [confirmDeleteTenant, setConfirmDeleteTenant] = useState<any>(null);
  const [extendTenantModal, setExtendTenantModal] = useState<any>(null);
  const [extendDays, setExtendDays] = useState<number>(30);

  // Edit Tenant State
  const [editTenantModal, setEditTenantModal] = useState<any>(null);
  const [editTenantForm, setEditTenantForm] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    subscriptionEndsAt: '',
  });

  // Edit Activation Code State
  const [editCodeModal, setEditCodeModal] = useState<any>(null);
  const [editCodeForm, setEditCodeForm] = useState({
    durationDays: 30,
    note: '',
  });

  // Copy Feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    showToast({ type: 'success', message: `تم نسخ الكود ${code} بنجاح` });
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = presetDuration === -1 ? parseInt(customDays) || 30 : presetDuration;
    if (days <= 0) {
      showToast({ type: 'error', message: 'يرجى إدخال عدد أيام تفعيل صحيح' });
      return;
    }

    setLoading(true);
    try {
      const res = await generateActivationCodes(count, days, note);
      showToast({
        type: 'success',
        message: `تم توليد ${res.count} كود تفعيل بنجاح (مدة التفعيل: ${days} يوم)`,
      });
      setShowGenModal(false);
      setNote('');
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'حدث خطأ أثناء توليد الأكواد' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!confirmDeleteCode) return;
    setLoading(true);
    try {
      await deleteActivationCode(confirmDeleteCode.id);
      showToast({ type: 'success', message: 'تم حذف كود التفعيل بنجاح' });
      setConfirmDeleteCode(null);
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'فشل حذف الكود' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllUsedCodes = async () => {
    setLoading(true);
    try {
      const res = await deleteAllUsedCodes();
      showToast({ type: 'success', message: `تم حذف ${res.count} كود مستخدم بنجاح` });
      setConfirmDeleteAllUsed(false);
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'فشل حذف الأكواد المستخدمة' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setLoading(true);
    try {
      await toggleTenantStatus(tenantId, newStatus);
      showToast({
        type: 'success',
        message: newStatus === 'ACTIVE' ? 'تم تفعيل المتجر بنجاح' : 'تم إيقاف حساب المتجر',
      });
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'فشل تغيير حالة المتجر' });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTenantModal) return;
    setLoading(true);
    try {
      await extendTenantSubscription(extendTenantModal.id, extendDays);
      showToast({
        type: 'success',
        message: `تم تمديد اشتراك متجر "${extendTenantModal.name}" لمدة ${extendDays} يوم بنجاح`,
      });
      setExtendTenantModal(null);
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'فشل تمديد الاشتراك' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenantConfirm = async () => {
    if (!confirmDeleteTenant) return;
    setLoading(true);
    try {
      await deleteTenant(confirmDeleteTenant.id);
      showToast({ type: 'success', message: 'تم حذف المتجر وكافة بياناته نهائياً' });
      setConfirmDeleteTenant(null);
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'فشل حذف المتجر' });
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Tenant Modal
  const openEditTenantModal = (tenant: any) => {
    let dateStr = '';
    if (tenant.subscriptionEndsAt) {
      const d = new Date(tenant.subscriptionEndsAt);
      dateStr = d.toISOString().split('T')[0];
    }
    setEditTenantForm({
      name: tenant.name || '',
      ownerName: tenant.ownerName || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      subscriptionEndsAt: dateStr,
    });
    setEditTenantModal(tenant);
  };

  // Submit Edit Tenant
  const handleUpdateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTenantModal) return;
    setLoading(true);
    try {
      await updateTenantData(editTenantModal.id, editTenantForm);
      showToast({ type: 'success', message: 'تم تحديث بيانات المتجر بنجاح' });
      setEditTenantModal(null);
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'فشل تحديث بيانات المتجر' });
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Code Modal
  const openEditCodeModal = (codeItem: any) => {
    setEditCodeForm({
      durationDays: codeItem.durationDays || 30,
      note: codeItem.note || '',
    });
    setEditCodeModal(codeItem);
  };

  // Submit Edit Code
  const handleUpdateCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCodeModal) return;
    setLoading(true);
    try {
      await updateActivationCodeData(editCodeModal.id, editCodeForm);
      showToast({ type: 'success', message: 'تم تحديث بيانات كود التفعيل بنجاح' });
      setEditCodeModal(null);
      router.refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'فشل تحديث الكود' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered Codes
  const filteredCodes = data.codes.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(codeSearch.toLowerCase()) ||
      (c.note && c.note.toLowerCase().includes(codeSearch.toLowerCase())) ||
      (c.usedByTenant && c.usedByTenant.name.toLowerCase().includes(codeSearch.toLowerCase()));

    if (codeFilter === 'active') return matchSearch && !c.isUsed;
    if (codeFilter === 'used') return matchSearch && c.isUsed;
    return matchSearch;
  });

  const totalCodePages = Math.ceil(filteredCodes.length / ITEMS_PER_PAGE) || 1;
  const paginatedCodes = filteredCodes.slice((codePage - 1) * ITEMS_PER_PAGE, codePage * ITEMS_PER_PAGE);

  // Filtered Tenants
  const filteredTenants = data.tenants.filter((t) => {
    return (
      t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(tenantSearch.toLowerCase())) ||
      (t.phone && t.phone.toLowerCase().includes(tenantSearch.toLowerCase()))
    );
  });

  const totalTenantPages = Math.ceil(filteredTenants.length / ITEMS_PER_PAGE) || 1;
  const paginatedTenants = filteredTenants.slice((tenantPage - 1) * ITEMS_PER_PAGE, tenantPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              لوحة المالك — توليد الأكواد وإدارة المتاجر
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            لوحة خاصة بمالك المنصة لإنشاء أكواد التفعيل، متابعة الاشتراكات، وإدارة المتاجر والتجار.
          </p>
        </div>

        <button
          onClick={() => setShowGenModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-lg shadow-md transition-all transform active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          توليد أكواد تفعيل جديدة
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">الأكواد المتاحة للبيع</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {data.stats.activeCodes}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">من إجمالي {data.stats.totalCodes} كود مولّد</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">الأكواد المستخدمة والمفعلة</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {data.stats.usedCodes}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">تم تفعيلها من قبل التجار</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">المتاجر المسجلة بالمنصة</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {data.stats.totalTenants}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{data.stats.activeTenants} متجر نشط حالياً</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي مستخدمي النظام</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {data.stats.totalUsers}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">تجار وموظفون مسجلون</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('codes')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'codes'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>أكواد التفعيل ({data.codes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6" />
          </svg>
          <span>المتاجر والتجار ({data.tenants.length})</span>
        </button>
      </div>

      {/* Tab 1: Codes Management */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <input
              type="text"
              placeholder="ابحث برقم الكود،  أو اسم المتجر..."
              value={codeSearch}
              onChange={(e) => {
                setCodeSearch(e.target.value);
                setCodePage(1);
              }}
              className="px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-80"
            />
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => {
                  setCodeFilter('all');
                  setCodePage(1);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  codeFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                الكل ({data.codes.length})
              </button>
              <button
                onClick={() => {
                  setCodeFilter('active');
                  setCodePage(1);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  codeFilter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                }`}
              >
                متاحة ({data.stats.activeCodes})
              </button>
              <button
                onClick={() => {
                  setCodeFilter('used');
                  setCodePage(1);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  codeFilter === 'used'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                }`}
              >
                مستخدمة ({data.stats.usedCodes})
              </button>

              {/* Bulk Delete All Used Codes Button */}
              {data.stats.usedCodes > 0 && (
                <button
                  onClick={() => setConfirmDeleteAllUsed(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors whitespace-nowrap flex items-center gap-1"
                  title="حذف جميع الأكواد المستخدمة لتنظيف الجدول"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  حذف الأكواد المستخدمة ({data.stats.usedCodes})
                </button>
              )}
            </div>
          </div>

          {/* Table Container with Horizontal Scroll & Uncompressed Cells */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-right text-sm min-w-max border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs">
                <tr>
                  <th className="p-3.5 whitespace-nowrap min-w-[170px]">كود التفعيل</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">مدة التفعيل</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">الحالة</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">تاريخ التوليد</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[160px]">المتجر المفعل</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[140px]">ملاحظات</th>
                  <th className="p-3.5 text-center whitespace-nowrap min-w-[100px]">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedCodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-sm whitespace-nowrap">
                      لا توجد أكواد تفعيل مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  paginatedCodes.map((codeItem) => (
                    <tr key={codeItem.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded text-sm tracking-wider">
                            {codeItem.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(codeItem.code, codeItem.id)}
                            className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title="نسخ الكود"
                          >
                            {copiedCodeId === codeItem.id ? (
                              <span className="text-xs font-bold text-emerald-600">تم النسخ!</span>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {codeItem.durationDays} يوم ({Math.round(codeItem.durationDays / 30)} شهر)
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {codeItem.isUsed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            مستخدم ومُفعّل
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            متاح للبيع
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatShortDate(codeItem.createdAt)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {codeItem.usedByTenant ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                              {codeItem.usedByTenant.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {codeItem.usedByTenant.ownerName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap max-w-xs truncate">
                        {codeItem.note || '-'}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit Action Button */}
                          <button
                            onClick={() => openEditCodeModal(codeItem)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="تعديل بيانات الكود"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Delete Action Button (Available for ALL codes) */}
                          <button
                            onClick={() => setConfirmDeleteCode(codeItem)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="حذف الكود"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Codes Pagination Navigation */}
          {filteredCodes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div>
                عرض من <span className="font-bold text-slate-900 dark:text-white">{((codePage - 1) * ITEMS_PER_PAGE) + 1}</span> إلى <span className="font-bold text-slate-900 dark:text-white">{Math.min(codePage * ITEMS_PER_PAGE, filteredCodes.length)}</span> من إجمالي <span className="font-bold text-slate-900 dark:text-white">{filteredCodes.length}</span> كود
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCodePage((p) => Math.max(1, p - 1))}
                  disabled={codePage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  السابقة
                </button>

                <span className="px-3.5 py-1.5 rounded-lg font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {codePage} / {totalCodePages}
                </span>

                <button
                  onClick={() => setCodePage((p) => Math.min(totalCodePages, p + 1))}
                  disabled={codePage >= totalCodePages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  التالية
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Tenants Management */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <input
              type="text"
              placeholder="ابحث باسم المتجر، التاجر، الجوال أو الإيميل..."
              value={tenantSearch}
              onChange={(e) => {
                setTenantSearch(e.target.value);
                setTenantPage(1);
              }}
              className="px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-96"
            />
          </div>

          {/* Table Container with Horizontal Scroll & Uncompressed Cells */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-right text-sm min-w-max border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs">
                <tr>
                  <th className="p-3.5 whitespace-nowrap min-w-[150px]">اسم المتجر</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[150px]">اسم التاجر / المالك</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[180px]">بيانات التواصل</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[140px]">تاريخ انتهاء الاشتراك</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">حالة الحساب</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[100px]">الفواتير</th>
                  <th className="p-3.5 text-center whitespace-nowrap min-w-[180px]">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-sm whitespace-nowrap">
                      لا توجد متاجر مسجلة مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  paginatedTenants.map((tenant) => {
                    const isExpired = tenant.subscriptionEndsAt && new Date() > new Date(tenant.subscriptionEndsAt);
                    return (
                      <tr key={tenant.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          {tenant.name}
                        </td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                          {tenant.ownerName}
                        </td>
                        <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <div>{tenant.phone || '-'}</div>
                          <div>{tenant.email || '-'}</div>
                        </td>
                        <td className="p-3.5 text-xs whitespace-nowrap">
                          {tenant.subscriptionEndsAt ? (
                            <div className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                              {formatShortDate(tenant.subscriptionEndsAt)}
                              {isExpired && <span className="block text-[10px] text-rose-500">منتهي</span>}
                            </div>
                          ) : (
                            'غير محدود'
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {tenant.status === 'ACTIVE' && !isExpired ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              نشط
                            </span>
                          ) : tenant.status === 'SUSPENDED' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              موقوف
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              اشتراك منتهي
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {tenant._count?.invoices || 0} فاتورة
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Edit Merchant Button */}
                            <button
                              onClick={() => openEditTenantModal(tenant)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="تعديل بيانات المتجر والتاجر"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Extend Button */}
                            <button
                              onClick={() => setExtendTenantModal(tenant)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded transition-colors"
                              title="تمديد الاشتراك"
                            >
                              + تمديد
                            </button>

                            {/* Suspend / Activate Toggle */}
                            <button
                              onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                                tenant.status === 'ACTIVE'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {tenant.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                            </button>

                            {/* Delete Tenant Button */}
                            <button
                              onClick={() => setConfirmDeleteTenant(tenant)}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded transition-colors"
                              title="حذف المتجر بالكامل"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Tenants Pagination Navigation */}
          {filteredTenants.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div>
                عرض من <span className="font-bold text-slate-900 dark:text-white">{((tenantPage - 1) * ITEMS_PER_PAGE) + 1}</span> إلى <span className="font-bold text-slate-900 dark:text-white">{Math.min(tenantPage * ITEMS_PER_PAGE, filteredTenants.length)}</span> من إجمالي <span className="font-bold text-slate-900 dark:text-white">{filteredTenants.length}</span> متجر
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTenantPage((p) => Math.max(1, p - 1))}
                  disabled={tenantPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  السابقة
                </button>

                <span className="px-3.5 py-1.5 rounded-lg font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {tenantPage} / {totalTenantPages}
                </span>

                <button
                  onClick={() => setTenantPage((p) => Math.min(totalTenantPages, p + 1))}
                  disabled={tenantPage >= totalTenantPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  التالية
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Generator Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl animate-scale-in space-y-5" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  توليد أكواد تفعيل جديدة
                </h3>
              </div>
              <button
                onClick={() => setShowGenModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateCodes} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدة التفعيل والاشتراك
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { label: '30 يوم (شهر)', days: 30 },
                    { label: '60 يوم (شهرين)', days: 60 },
                    { label: '90 يوم (3 أشهر)', days: 90 },
                    { label: '180 يوم (6 أشهر)', days: 180 },
                    { label: '365 يوم (سنة كاملة)', days: 365 },
                    { label: 'مدة مخصصة', days: -1 },
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setPresetDuration(p.days)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                        presetDuration === p.days
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {presetDuration === -1 && (
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      أدخل عدد الأيام بالظبط:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                      placeholder="مثال: 45"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عدد الأكواد المراد توليدها
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري التوليد...' : 'توليد الأكواد فوراً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant / Merchant Modal */}
      {editTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl animate-scale-in space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                تعديل بيانات المتجر والتاجر
              </h3>
              <button
                onClick={() => setEditTenantModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTenantSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المتجر
                </label>
                <input
                  type="text"
                  required
                  value={editTenantForm.name}
                  onChange={(e) => setEditTenantForm({ ...editTenantForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم التاجر / المالك
                </label>
                <input
                  type="text"
                  required
                  value={editTenantForm.ownerName}
                  onChange={(e) => setEditTenantForm({ ...editTenantForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الجوال
                  </label>
                  <input
                    type="text"
                    value={editTenantForm.phone}
                    onChange={(e) => setEditTenantForm({ ...editTenantForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    required
                    value={editTenantForm.email}
                    onChange={(e) => setEditTenantForm({ ...editTenantForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ انتهاء الاشتراك
                </label>
                <input
                  type="date"
                  value={editTenantForm.subscriptionEndsAt}
                  onChange={(e) => setEditTenantForm({ ...editTenantForm, subscriptionEndsAt: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTenantModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Activation Code Modal */}
      {editCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl animate-scale-in space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                تعديل كود التفعيل ({editCodeModal.code})
              </h3>
              <button
                onClick={() => setEditCodeModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCodeSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدة التفعيل بالأيام
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editCodeForm.durationDays}
                  onChange={(e) => setEditCodeForm({ ...editCodeForm, durationDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditCodeModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Subscription Modal */}
      {extendTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl animate-scale-in space-y-4" dir="rtl">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              تمديد اشتراك متجر "{extendTenantModal.name}"
            </h3>
            <form onSubmit={handleExtendSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اختر عدد الأيام المراد إضافتها:
                </label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-bold"
                >
                  <option value={15}>+ 15 يوم</option>
                  <option value={30}>+ 30 يوم (شهر)</option>
                  <option value={60}>+ 60 يوم (شهرين)</option>
                  <option value={90}>+ 90 يوم (3 أشهر)</option>
                  <option value={180}>+ 180 يوم (6 أشهر)</option>
                  <option value={365}>+ 365 يوم (سنة)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendTenantModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  تأكيد التمديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Code Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteCode)}
        title="حذف كود التفعيل"
        message={`هل أنت متأكد من رغبتك في حذف كود التفعيل (${confirmDeleteCode?.code})؟`}
        confirmText="حذف الكود"
        cancelText="إلغاء"
        onConfirm={handleDeleteCode}
        onCancel={() => setConfirmDeleteCode(null)}
        loading={loading}
      />

      {/* Bulk Delete All Used Codes Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDeleteAllUsed}
        title="حذف جميع الأكواد المستخدمة"
        message={`هل أنت متأكد من رغبتك في حذف جميع الأكواد المستخدمة (${data.stats.usedCodes} كود)؟ هذا الإجراء سيقوم بتنظيف قائمة الأكواد ولن يؤثر على اشتراكات المتاجر الحالية.`}
        confirmText="حذف الأكواد المستخدمة"
        cancelText="إلغاء"
        onConfirm={handleDeleteAllUsedCodes}
        onCancel={() => setConfirmDeleteAllUsed(false)}
        loading={loading}
      />

      {/* Delete Tenant Confirm */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteTenant)}
        title="حذف المتجر بالكامل"
        message={`تحذير: هل أنت متأكد من حذف متجر "${confirmDeleteTenant?.name}"؟ سيتم حذف جميع فواتيره وموظفيه وحساباته نهائياً من النظام!`}
        confirmText="نعم، احذف المتجر"
        cancelText="إلغاء"
        onConfirm={handleDeleteTenantConfirm}
        onCancel={() => setConfirmDeleteTenant(null)}
        loading={loading}
      />
    </div>
  );
}
