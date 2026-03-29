import { useState, type ReactNode } from 'react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { 
  LayoutDashboard, 
  Settings,
  History as HistoryIcon,
  Bell,
  Search,
  Shield,
  Menu,
  X,
  Layers as LayersIcon,
  Building2,
  MessageSquare
} from 'lucide-react';
import OrgSwitcher from '@/adminSystem/features/organizations/components/OrgSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import SidebarAccountMenu from '@/shared/components/ui/SidebarAccountMenu';
import SidebarDropdownSection from '@/shared/components/ui/SidebarDropdownSection';

interface AdminSystemLayoutProps {
  children: ReactNode;
}

export default function AdminSystemLayout({ children }: AdminSystemLayoutProps) {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuSections = [
    {
      id: 'overview',
      label: 'Tổng quan',
      defaultOpen: true,
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển tổng', path: '/system/dashboard', exact: true },
        ...(user?.role === 'Admin'
          ? [{ id: 'organizations', icon: LayersIcon, label: 'Danh sách tổ chức', path: '/system/organizations', exact: true }]
          : []),
      ],
    },
    {
      id: 'operations',
      label: 'Điều hành',
      items: [
        { id: 'communication', icon: MessageSquare, label: 'Liên lạc và thông báo', path: '/system/communication' },
        { id: 'audit', icon: HistoryIcon, label: 'Nhật ký hệ thống', path: '/system/audit-logs' },
      ],
    },
    {
      id: 'security',
      label: 'Bảo mật',
      items: [
        { id: 'sessions', icon: Shield, label: 'Bảo mật và phiên làm', path: '/system/sessions' },
        { id: 'settings', icon: Settings, label: 'Cài đặt hệ thống', path: '/system/settings' },
      ],
    },
  ].filter((section) => section.items.length > 0);

  const renderSidebarContent = () => (
    <>
      <div className="flex items-center justify-between border-b border-slate-200/50 px-5 py-5 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-linear-to-br from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Hostech V2
          </h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-4 py-3">
        {user?.role === 'Admin' ? (
          <OrgSwitcher />
        ) : (
          <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex items-center justify-between group opacity-75">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-1">Tá»• chá»©c</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate italic">Quáº£n lÃ½ bá»Ÿi há»‡ thá»‘ng</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-2 custom-scrollbar">
        <div className="mb-3 mt-1 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
           Quáº£n trá»‹ há»‡ thá»‘ng
        </div>

        {menuSections.map((section) => (
          <SidebarDropdownSection
            key={section.id}
            label={section.label}
            items={section.items}
            defaultOpen={section.defaultOpen}
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/30">
        <SidebarAccountMenu
          profilePath="/system/profile"
          userName={user?.full_name}
          role={user?.role}
          onLogout={() => {
            logout();
            setIsMobileMenuOpen(false);
          }}
          onActionComplete={() => setIsMobileMenuOpen(false)}
        />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 lg:flex">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl dark:bg-slate-800 lg:hidden"
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/50 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight hidden xl:block">Quáº£n trá»‹ há»‡ thá»‘ng</h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="TÃ¬m kiáº¿m há»‡ thá»‘ng..."
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


