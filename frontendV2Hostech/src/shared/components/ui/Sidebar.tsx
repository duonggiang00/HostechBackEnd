import type { ReactNode } from 'react';
import { useState } from 'react';
import { X, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { authApi } from '@/shared/features/auth/api/auth';
import SidebarAccountMenu, { type SidebarAccountVariant } from '@/shared/components/ui/SidebarAccountMenu';
import SidebarDropdownSection, {
  type SidebarDropdownItem,
  type SidebarNavVariant,
} from '@/shared/components/ui/SidebarDropdownSection';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export interface SidebarSection {
  id: string;
  label: string;
  icon?: LucideIcon;
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
  profilePath?: string;
  scopeLabel?: string;
  exitLink?: ReactNode;
  variant?: SidebarNavVariant;
}

export default function Sidebar({
  isOpen,
  onClose,
  menuSections,
  switcher,
  extraContent,
  profilePath,
  scopeLabel,
  exitLink,
  variant = 'default',
}: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const isDark = variant === 'darkConsole';
  const accountVariant: SidebarAccountVariant = isDark ? 'darkConsole' : 'default';

  const renderContent = () => (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden ${
        isDark ? 'bg-[#0d0d0f] text-slate-200' : 'bg-white'
      }`}
    >
      <div
        className={`relative z-10 flex shrink-0 items-center justify-between border-b py-5 transition-all duration-300 ${
          isDark ? 'border-white/10' : 'border-gray-100'
        } ${isCollapsed ? 'flex-col justify-center gap-3 px-0' : 'px-5'}`}
      >
        <div className={`flex items-center gap-3 ${isCollapsed ? 'mx-auto justify-center' : ''}`}>
          {isCollapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-sm transition-transform duration-200">
              <span className="text-lg font-black tracking-tighter text-white">H</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-500/20">
                <span className="text-xl font-black tracking-tighter text-white">H</span>
              </div>
              <div className="flex flex-col">
                <h1
                  className={`text-sm font-black leading-none tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  Hostech<span className="text-brand-600">.</span>
                </h1>
                <span
                  className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {isDark ? 'Org Console' : 'Property Manager'}
                </span>
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden rounded-md p-1.5 transition-colors lg:flex ${
              isDark
                ? 'text-slate-500 hover:bg-white/10 hover:text-slate-200'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Thu gọn menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}

        {isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden rounded-md p-1.5 transition-colors lg:flex ${
              isDark
                ? 'text-slate-500 hover:bg-white/10 hover:text-slate-200'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Mở rộng menu"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className={`rounded-md p-2 transition-colors lg:hidden ${
            isDark
              ? 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className={`relative z-10 flex flex-1 flex-col overflow-y-auto pb-6 transition-all scrollbar-thin ${
          isDark
            ? 'scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20'
            : 'scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300'
        }`}
      >
        {switcher && (
          <div className={`shrink-0 py-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            <div
              className={`flex justify-center rounded-md border ${isCollapsed ? 'p-0.5' : 'p-1'} ${
                isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {switcher}
            </div>
          </div>
        )}

        <nav className="mt-2 shrink-0 space-y-1.5 px-0">
          {exitLink && <div className={`mb-2 ${isCollapsed ? 'px-1' : 'px-4'}`}>{exitLink}</div>}

          {scopeLabel && !isCollapsed && (
            <div className="mb-1 mt-4 px-5 py-1">
              <span
                className={`text-[11px] font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-500' : 'text-gray-400'
                }`}
              >
                {scopeLabel}
              </span>
            </div>
          )}

          <div className="space-y-2 pb-4 pt-1">
            {menuSections.map((section) => (
              <SidebarDropdownSection
                key={section.id}
                label={section.label}
                icon={section.icon}
                items={section.items}
                defaultOpen={section.defaultOpen}
                onNavigate={onClose}
                path={section.path}
                isCollapsed={isCollapsed}
                navVariant={variant}
              />
            ))}
          </div>
        </nav>

        {extraContent && !isCollapsed && (
          <div className="relative mt-8 h-full px-5">
            <div className={`absolute left-5 right-5 top-0 h-px ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
            <div className="h-full pt-6">{extraContent}</div>
          </div>
        )}
      </div>

      <div
        className={`z-10 w-full shrink-0 border-t p-4 transition-colors ${
          isDark ? 'border-white/10 bg-[#0d0d0f]' : 'border-gray-200 bg-white'
        } ${isCollapsed ? 'px-2' : 'px-4'}`}
      >
        <SidebarAccountMenu
          profilePath={profilePath}
          userName={user?.full_name}
          role={user?.role}
          onLogout={async () => {
            try {
              await authApi.logout();
            } catch {
              // Best-effort server logout; always clear local session.
            } finally {
              logout();
              queryClient.clear();
              navigate('/login', { replace: true });
              onClose();
            }
          }}
          onActionComplete={onClose}
          isCollapsed={isCollapsed}
          variant={accountVariant}
        />
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen flex-col overflow-hidden border-r transition-all duration-300 ease-in-out lg:flex ${
          isDark ? 'border-white/10 bg-[#0d0d0f]' : 'border-gray-200 bg-white'
        } ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
      >
        {renderContent()}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r shadow-2xl lg:hidden ${
                isDark ? 'border-white/10 bg-[#0d0d0f]' : 'border-gray-200 bg-white'
              }`}
            >
              {renderContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
