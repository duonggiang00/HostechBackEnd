import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useSessionBootstrap } from '@/shared/features/auth/hooks/useSessionBootstrap';
import { useOrgFinanceRealtime } from '@/shared/features/billing/hooks/useFinanceRealtime';
import { useNavigation } from '@/shared/hooks/useNavigation';
import Sidebar from '@/shared/components/ui/Sidebar';
import PropertySwitcher from '@/OrgScope/features/properties/components/PropertySwitcher';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';

/**
 * Shell độc lập cho cổng tài chính org (/org/dashboard, /org/finance):
 * sidebar + vùng nội dung tối, không lồng trong OrgScopeLayout sáng.
 */
export default function OrgFinanceConsoleLayout() {
  const user = useAuthStore((s) => s.user);
  useSessionBootstrap();
  useOrgFinanceRealtime(user?.org_id ?? undefined);

  const { menuSections, scopeLabel } = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0A0A0B] text-slate-200">
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuSections={menuSections}
        switcher={<PropertySwitcher variant="sidebar" />}
        profilePath="/org/profile"
        scopeLabel={scopeLabel}
        variant="darkConsole"
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-end gap-2 border-b border-white/10 px-3 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="mr-auto rounded-xl p-2 text-slate-300 hover:bg-white/10"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-6 w-6" />
          </button>
          <ThemeToggle />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
