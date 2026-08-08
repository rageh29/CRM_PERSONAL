'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { ROLE_LABELS } from '@/lib/utils';
import { hasPermission } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'الرئيسية', icon: 'home', permission: 'invoices:view' },
  { href: '/dashboard/invoices', label: 'الفواتير', icon: 'invoice', permission: 'invoices:view' },
  { href: '/dashboard/invoices/new', label: 'فاتورة جديدة', icon: 'plus', permission: 'invoices:create' },
  { href: '/dashboard/users', label: 'الموظفين والصلاحيات', icon: 'users', permission: 'users:manage' },
  { href: '/dashboard/comparisons', label: 'المقارنات', icon: 'chart', permission: 'invoices:view' },
  { href: '/dashboard/reports', label: 'التقارير', icon: 'report', permission: 'reports:export' },
  { href: '/dashboard/activity', label: 'سجل النشاط', icon: 'activity', permission: 'activity:view' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: 'settings', permission: 'settings:manage' },
];

const MOBILE_NAV = [
  { href: '/dashboard', label: 'الرئيسية', icon: 'home', isMenu: false, permission: 'invoices:view' },
  { href: '/dashboard/invoices', label: 'الفواتير', icon: 'invoice', isMenu: false, permission: 'invoices:view' },
  { href: '/dashboard/invoices/new', label: 'جديدة', icon: 'plus', isMenu: false, permission: 'invoices:create' },
  { href: '/dashboard/comparisons', label: 'المقارنات', icon: 'chart', isMenu: false, permission: 'invoices:view' },
  { href: '#', label: 'المزيد', icon: 'menu', isMenu: true, permission: '*' },
];

function isLinkActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === currentPath) return true;
  if (itemHref === '/dashboard') return false;
  if (itemHref === '/dashboard/invoices' && currentPath === '/dashboard/invoices/new') return false;
  return currentPath.startsWith(itemHref + '/');
}

function NavIcon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
    invoice: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    plus: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
    users: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    chart: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
    report: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>,
    shield: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    activity: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    settings: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    menu: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
    sun: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
    moon: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>,
    logout: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>,
  };
  return icons[name] || null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [customStoreName, setCustomStoreName] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/settings/logo')
        .then((res) => res.json())
        .then((data) => {
          if (data?.logo) setTenantLogo(data.logo);
          if (data?.companyName) setCustomStoreName(data.companyName);
        })
        .catch(() => {});
    }
  }, [status, pathname]);

  // Avoid layout shift/flickering by showing a smooth skeleton during session load
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 animate-pulse">
        <aside className="fixed inset-y-0 start-0 z-50 w-64 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800/80 flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="flex-1 p-3 space-y-3 mt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 rounded-md"></div>
            ))}
          </div>
        </aside>
        <main className="flex-1 lg:ps-64 w-full">
          <div className="p-6">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-md mb-6"></div>
            <div className="h-64 w-full bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  const user = session?.user as any;
  const userRole = user?.role as string || 'EMPLOYEE';
  const isMasterAdmin = Boolean(user?.isMasterAdmin || userRole === 'MASTER_ADMIN');
  const tenantName = user?.tenantName || null;
  const userPermissions = user?.permissions || [];

  // Dynamic Store Title: "High System" for Master Admin, merchant store name for merchants
  const platformTitle = isMasterAdmin
    ? (customStoreName && customStoreName !== session?.user?.name && customStoreName !== 'نظام ايرور المحاسبي' ? customStoreName : 'High System')
    : (customStoreName || tenantName || 'متجري');

  // Include Master Admin Nav Link if user is Master Admin
  const navItems = isMasterAdmin
    ? [
        { href: '/dashboard/master', label: 'لوحة المالك (أكواد التفعيل)', icon: 'shield', permission: '*' },
        ...NAV_ITEMS,
      ]
    : NAV_ITEMS;

  const filteredNav = navItems.filter((item) => item.permission === '*' || hasPermission(userRole, userPermissions, item.permission));
  const filteredMobileNav = MOBILE_NAV.filter((item) => item.isMenu || hasPermission(userRole, userPermissions, item.permission));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Responsive Mobile Drawer & Desktop Fixed Sidebar) */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-64 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            {tenantLogo ? (
              <img
                src={tenantLogo}
                alt="شعار المنصة"
                className="h-11 w-11 object-contain flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700/50"
              />
            ) : isMasterAdmin ? (
              <>
                {/* Light Theme Default Logo for Master Admin */}
                <img
                  src="/icon logo.png"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icon logo.png'; }}
                  alt="شعار المنصة"
                  className="h-11 w-auto object-contain dark:hidden flex-shrink-0"
                />
                {/* Dark Theme Default Logo for Master Admin */}
                <img
                  src="/icon logo.png"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icon logo.png'; }}
                  alt="شعار المنصة"
                  className="h-11 w-auto object-contain hidden dark:block flex-shrink-0 drop-shadow-md"
                />
              </>
            ) : null}
            <div className="flex flex-col min-w-0">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate" title={platformTitle}>
                {platformTitle}
              </h2>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = isLinkActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white shadow-md border-s-4 border-emerald-400 dark:border-amber-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <NavIcon name={item.icon} className={`w-4 h-4 ${isActive ? 'text-white dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-amber-300 dark:border dark:border-amber-500/30 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{session?.user?.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-amber-400 font-medium">
                {isMasterAdmin ? 'المالك الرئيسي' : (ROLE_LABELS[userRole] || userRole)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors border border-transparent dark:border-slate-700/60"
            >
              <NavIcon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4 text-amber-500" />
              {theme === 'dark' ? 'نهاري' : 'ليلي'}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/80 hover:bg-red-100 transition-colors border border-transparent dark:border-red-900/40"
            >
              <NavIcon name="logout" className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ps-64 pb-20 lg:pb-0 w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                <NavIcon name="menu" className="w-5 h-5" />
              </button>
              <Link href="/dashboard" className="flex items-center gap-2">
                {tenantLogo ? (
                  <img
                    src={tenantLogo}
                    alt="شعار المنصة"
                    className="h-8 w-8 object-contain flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded p-0.5 border border-slate-200 dark:border-slate-700/50"
                  />
                ) : isMasterAdmin ? (
                  <>
                    <img
                      src="/icon logo.png"
                      alt="شعار المنصة"
                      className="h-8 w-auto object-contain dark:hidden flex-shrink-0"
                    />
                    <img
                      src="/icon logo.png"
                      alt="شعار المنصة"
                      className="h-8 w-auto object-contain hidden dark:block flex-shrink-0 drop-shadow-sm"
                    />
                  </>
                ) : null}
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight truncate">{platformTitle}</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              >
                <NavIcon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4" />
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-red-600"
              >
                <NavIcon name="logout" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-3 sm:p-6 w-full max-w-full min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-around px-2 py-1">
          {filteredMobileNav.map((item) => {
            const isActive = !item.isMenu && isLinkActive(item.href, pathname);
            const isAddButton = item.icon === 'plus';

            if (item.isMenu) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-md transition-colors ${
                    sidebarOpen ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <NavIcon name={item.icon} className="w-5 h-5" />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-md transition-colors ${
                  isAddButton
                    ? 'relative -mt-4'
                    : isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isAddButton ? (
                  <div className="w-11 h-11 bg-emerald-600 rounded-full flex items-center justify-center shadow-md text-white">
                    <NavIcon name={item.icon} className="w-5 h-5" />
                  </div>
                ) : (
                  <NavIcon name={item.icon} className="w-5 h-5" />
                )}
                <span className={`text-[10px] font-bold ${isAddButton ? 'text-emerald-600 dark:text-emerald-400 mt-0.5' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
