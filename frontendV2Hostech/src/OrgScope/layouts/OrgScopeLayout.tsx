import { useState, type ReactNode } from 'react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useNavigation } from '@/shared/hooks/useNavigation';
import Breadcrumbs from '@/shared/components/ui/Breadcrumbs';
import { 
  Building2, 
  Users, 
  Receipt, 
  BarChart3,
  LayoutDashboard,
  Bell,
  Search,
  Shield,
  Menu,
} from 'lucide-react';
import PropertySwitcher from '@/OrgScope/features/properties/components/PropertySwitcher';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import Sidebar from '@/shared/components/ui/Sidebar';

interface OrgScopeLayoutProps {
  children: ReactNode;
}

export default function OrgScopeLayout({ children }: OrgScopeLayoutProps) {
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/50 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-all duration-300">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden xl:flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Cổng Quản Trị</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm kiếm hệ thống..."
                className="pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl outline-none focus:border-indigo-200 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-sm font-bold w-48 lg:w-64 shadow-inner text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer border border-slate-100 dark:border-slate-600 relative group">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800 group-hover:scale-110 transition-transform" />
            </div>

            <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 mx-1 hidden md:block" />
            
            <ThemeToggle />
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
