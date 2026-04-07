import type { ReactNode } from 'react';
import { 
  Building2, 
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import SidebarAccountMenu from '@/shared/components/ui/SidebarAccountMenu';
import SidebarDropdownSection, { type SidebarDropdownItem } from '@/shared/components/ui/SidebarDropdownSection';

export interface SidebarSection {
  id: string;
  label: string;
  defaultOpen?: boolean;
  items: SidebarDropdownItem[];
  path?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuSections: SidebarSection[];
  switcher?: ReactNode;
  extraContent?: ReactNode;
  profilePath: string;
  scopeLabel?: string;
  exitLink?: ReactNode;
}

export default function Sidebar({
  isOpen,
  onClose,
  menuSections,
  switcher,
  extraContent,
  profilePath,
  scopeLabel,
  exitLink
}: SidebarProps) {
  const { user, logout } = useAuthStore();

  const renderContent = () => (
    <div className="flex h-full w-full flex-col glass-sidebar relative overflow-hidden">
      {/* Premium Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-0 dark:brightness-200" />
      
      {/* Brand Header */}
      <div className="flex shrink-0 items-center justify-between px-6 py-8 pb-4 relative z-10">
        <div className="flex items-center gap-3.5 group">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-brand-600 dark:bg-brand-500 shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-500">
            <Building2 className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col gap-0">
            <h1 className="text-[1.25rem] font-black text-slate-800 dark:text-white leading-tight tracking-tight">
              Hostech
            </h1>
            <span className="text-[0.625rem] font-bold text-brand-500/80 dark:text-brand-400 uppercase tracking-[0.2em]">
              Premium Suite
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 lg:hidden transition-all duration-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-6 relative z-10">
        {/* Module Switcher Section */}
        {switcher && (
          <div className="shrink-0 px-4 py-4">
            <div className="rounded-2xl border border-slate-200/40 bg-white/40 p-1 dark:border-white/5 dark:bg-white/5 backdrop-blur-sm">
              {switcher}
            </div>
          </div>
        )}

        {/* Navigation Core */}
        <nav className="shrink-0 space-y-2 px-3">
          {/* Exit/Return Link (Context Switcher) */}
          {exitLink && <div className="px-2 mb-4">{exitLink}</div>}

          {/* Scope Label (Visual Hierarchy) */}
          {scopeLabel && (
            <div className="px-5 mb-4 py-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-linear-to-r from-brand-500/20 to-transparent" />
                <span className="shrink-0 text-[0.6875rem] font-black uppercase tracking-[0.25em] text-slate-400/80 dark:text-slate-500/80">
                  {scopeLabel}
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-brand-500/20 to-transparent" />
              </div>
            </div>
          )}

          {/* Dynamic Navigation Sections */}
          <div className="space-y-6">
            {menuSections.map((section) => (
              <SidebarDropdownSection
                key={section.id}
                label={section.label}
                items={section.items}
                defaultOpen={section.defaultOpen}
                onNavigate={onClose}
                path={section.path}
              />
            ))}
          </div>
        </nav>

        {/* Extra Context Content (e.g., TreeView) */}
        {extraContent && (
          <div className="mt-8 px-4 relative">
             <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-slate-200/50 dark:via-white/5 to-transparent"></div>
             <div className="pt-6">
                {extraContent}
             </div>
          </div>
        )}
      </div>

      {/* Account Sidebar Footer */}
      <div className="w-full shrink-0 border-t border-slate-200/40 bg-white/30 p-4 dark:border-white/5 dark:bg-transparent backdrop-blur-md relative z-10">
        <SidebarAccountMenu
          profilePath={profilePath}
          userName={user?.full_name}
          role={user?.role}
          onLogout={() => {
            logout();
            onClose();
          }}
          onActionComplete={onClose}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Wrapper */}
      <aside className="sticky top-0 hidden h-screen w-[280px] flex-col lg:flex overflow-hidden border-r border-slate-200/50 dark:border-white/5">
        {renderContent()}
      </aside>

      {/* Mobile Wrapper */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col shadow-2xl lg:hidden"
            >
              {renderContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
