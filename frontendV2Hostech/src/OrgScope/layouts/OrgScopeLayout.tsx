import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useSessionBootstrap } from '@/shared/features/auth/hooks/useSessionBootstrap';
import { useOrgFinanceRealtime } from '@/shared/features/billing/hooks/useFinanceRealtime';
import { useNavigation } from '@/shared/hooks/useNavigation';
import Breadcrumbs from '@/shared/components/ui/Breadcrumbs';
import { Bell, Search, Shield, Menu } from 'lucide-react';
import PropertySwitcher from '@/OrgScope/features/properties/components/PropertySwitcher';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import Sidebar from '@/shared/components/ui/Sidebar';

export default function OrgScopeLayout() {
  const user = useAuthStore((s) => s.user);
  useSessionBootstrap();
  useOrgFinanceRealtime(user?.org_id ?? undefined);

  const { menuSections, scopeLabel } = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f5f5f9] font-sans text-[#697a8d] dark:bg-[#232333] dark:text-[#a3b4cc]">
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuSections={menuSections}
        switcher={<PropertySwitcher variant="sidebar" />}
        profilePath="/org/profile"
        scopeLabel={scopeLabel}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-800/80 md:px-8">
          <div className="flex min-w-0 items-center gap-3 md:gap-6">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden items-center gap-3 xl:flex">
              <Shield className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Cổng Quản Trị</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="group relative hidden md:block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
              <input
                type="text"
                placeholder="Tìm kiếm hệ thống..."
                className="w-48 rounded-2xl border border-slate-100 bg-slate-50 py-2.5 pl-12 pr-6 text-sm font-bold text-slate-900 shadow-inner outline-none transition-all placeholder:text-slate-400 focus:border-indigo-200 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-700 lg:w-64"
              />
            </div>
            <div className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 transition-colors hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:text-indigo-400">
              <Bell className="h-5 w-5" />
              <div className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500 transition-transform group-hover:scale-110 dark:border-slate-800" />
            </div>

            <div className="mx-1 hidden h-8 w-px bg-slate-100 dark:bg-slate-700 md:block" />

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="fade-in animate-in mx-auto max-w-7xl duration-700">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
