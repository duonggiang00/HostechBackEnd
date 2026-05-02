import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Bell,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import PropertySwitcher from '@/OrgScope/features/properties/components/PropertySwitcher';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import Sidebar from '@/shared/components/ui/Sidebar';
import { useNavigation } from '@/shared/hooks/useNavigation';
import Breadcrumbs from '@/shared/components/ui/Breadcrumbs';
import NotificationCenter from '@/shared/features/messaging/components/NotificationCenter';
import { usePropertyFinanceRealtime } from '@/shared/features/billing/hooks/useFinanceRealtime';
import { useSessionBootstrap } from '@/shared/features/auth/hooks/useSessionBootstrap';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

interface PropertyScopeLayoutProps {
  children: ReactNode;
}

export default function PropertyScopeLayout({ children }: PropertyScopeLayoutProps) {
  const { propertyId } = useParams<{ propertyId: string }>();
  useSessionBootstrap();
  usePropertyFinanceRealtime(propertyId);

  const { menuSections, scopeLabel } = useNavigation();
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isStaff = hasRole(['Staff']);
  /** Chỉ Admin/Owner vào Org dashboard — Manager & Staff làm việc trong phạm vi tòa, không hiện nút cổng quản trị */
  const canExitToOrg = hasRole(['Admin', 'Owner']);

  const roleHeaderBadge = (() => {
    if (hasRole(['Staff'])) {
      return { label: 'Nhân viên', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' };
    }
    if (hasRole(['Manager'])) {
      return { label: 'Quản lý', className: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' };
    }
    if (hasRole(['Admin', 'Owner'])) {
      return { label: 'Quản trị', className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' };
    }
    return null;
  })();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f5f5f9] font-sans text-[#697a8d] dark:bg-[#232333] dark:text-[#a3b4cc]">
      {/* Desktop Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuSections={menuSections}
        scopeLabel={scopeLabel}
        profilePath={propertyId ? `/properties/${propertyId}/profile` : undefined}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="min-h-16 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/50 px-4 md:px-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 shrink-0 sticky top-0 z-30 transition-all duration-300 md:flex-nowrap">
          <div className="flex min-w-0 max-w-full flex-1 items-center gap-2 md:gap-4 md:min-w-[120px]">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Building2 className="w-5 h-5 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">
                    Vận Hành
                  </h2>
                  {roleHeaderBadge && (
                    <span
                      className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${roleHeaderBadge.className}`}
                    >
                      {roleHeaderBadge.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`flex flex-none items-center ${isStaff ? 'gap-2' : 'gap-3'}`}
          >
            {canExitToOrg && (
              <button
                type="button"
                onClick={() => navigate('/org/dashboard')}
                title="Quay về Cổng Quản Trị"
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-white hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-slate-700 dark:hover:text-indigo-300 sm:px-3 sm:text-xs"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Cổng Quản Trị</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              className="relative z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 transition-colors hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:text-indigo-400"
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" />
              <span className="pointer-events-none absolute right-2 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500 dark:border-slate-800" />
            </button>

            <div className="mx-0.5 hidden h-8 w-px shrink-0 bg-slate-100 dark:bg-slate-700 md:block" />

            <div className="hidden w-[180px] shrink-0 md:block lg:w-[220px]">
              <PropertySwitcher variant="header" />
            </div>

            <div className="shrink-0">
              <ThemeToggle compact={true} />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>

      <NotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
    </div>
  );
}
