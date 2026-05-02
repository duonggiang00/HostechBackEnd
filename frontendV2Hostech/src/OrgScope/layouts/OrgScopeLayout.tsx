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

/** Shell thống nhất Org Console: nền tối, accent emerald, cùng hệ với /org/dashboard. */
export default function OrgScopeLayout() {
  const user = useAuthStore((s) => s.user);
  useSessionBootstrap();
  useOrgFinanceRealtime(user?.org_id ?? undefined);

  const { menuSections, scopeLabel } = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0A0A0B] font-sans text-slate-200">
      <Sidebar
        variant="darkConsole"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuSections={menuSections}
        switcher={<PropertySwitcher variant="sidebar" />}
        profilePath="/org/profile"
        scopeLabel={scopeLabel}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#0d0d0f]/90 px-4 backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-3 md:gap-6">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden items-center gap-3 xl:flex">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-black tracking-tight text-white">Cổng Quản Trị</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="group relative hidden md:block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
              <input
                type="text"
                placeholder="Tìm kiếm hệ thống..."
                className="w-48 rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-12 pr-6 text-sm font-bold text-white shadow-inner outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500/40 focus:bg-white/10 lg:w-64"
              />
            </div>
            <div className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:text-emerald-400">
              <Bell className="h-5 w-5" />
              <div className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-[#0d0d0f] bg-rose-500 transition-transform group-hover:scale-110" />
            </div>

            <div className="mx-1 hidden h-8 w-px bg-white/10 md:block" />

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.04),transparent_45%)] p-4 md:p-8">
          <div className="fade-in animate-in mx-auto max-w-7xl duration-700">
            <Breadcrumbs tone="darkConsole" />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
