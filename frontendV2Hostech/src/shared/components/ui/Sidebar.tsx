import type { ReactNode } from 'react';
import { useState } from 'react';
import { 
  Building2, 
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import SidebarAccountMenu from '@/shared/components/ui/SidebarAccountMenu';
import SidebarDropdownSection, { type SidebarDropdownItem } from '@/shared/components/ui/SidebarDropdownSection';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const renderContent = () => (
    <div className="flex h-full w-full flex-col bg-white relative overflow-hidden">
      {/* Brand Header */}
      <div className={`flex shrink-0 items-center justify-between py-5 border-b border-gray-100 relative z-10 transition-all duration-300 ${isCollapsed ? 'px-0 justify-center flex-col gap-3' : 'px-5'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center mx-auto' : ''}`}>
          {isCollapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 shadow-sm transition-transform duration-200">
               <Building2 className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 shadow-sm transition-transform duration-200">
                <Building2 className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 font-sans leading-none mt-[2px]">
                  Hostech
                </h1>
              </div>
            </>
          )}
        </div>
        
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Thu gọn menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Mở rộng menu"
          >
             <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col pb-6 relative z-10 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 transition-all">
        {/* Module Switcher Section */}
        {switcher && (
          <div className={`shrink-0 py-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            <div className={`rounded-md border border-gray-200 bg-gray-50 flex justify-center ${isCollapsed ? 'p-0.5' : 'p-1'}`}>
              {switcher}
            </div>
          </div>
        )}

        {/* Navigation Core */}
        <nav className="shrink-0 space-y-1.5 px-0 mt-2">
          {/* Exit/Return Link (Context Switcher) */}
          {exitLink && <div className={`mb-2 ${isCollapsed ? 'px-1' : 'px-4'}`}>{exitLink}</div>}

          {/* Scope Label (Visual Hierarchy) */}
          {scopeLabel && !isCollapsed && (
            <div className="px-5 mb-1 mt-4 py-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {scopeLabel}
              </span>
            </div>
          )}

          {/* Dynamic Navigation Sections */}
          <div className="space-y-2 pt-1 pb-4">
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
              />
            ))}
          </div>
        </nav>

        {/* Extra Context Content (e.g., TreeView) */}
        {extraContent && !isCollapsed && (
          <div className="mt-8 px-5 relative h-full">
             <div className="absolute top-0 left-5 right-5 h-px bg-gray-100"></div>
             <div className="pt-6 h-full">
                {extraContent}
             </div>
          </div>
        )}
      </div>

      {/* Account Sidebar Footer */}
      <div className={`w-full shrink-0 border-t border-gray-200 bg-white p-4 transition-colors z-10 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <SidebarAccountMenu
          profilePath={profilePath}
          userName={user?.full_name}
          role={user?.role}
          onLogout={() => {
            logout();
            onClose();
          }}
          onActionComplete={onClose}
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Wrapper */}
      <aside 
        className={`sticky top-0 hidden h-screen flex-col lg:flex overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
      >
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
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col shadow-2xl lg:hidden border-r border-gray-200 bg-white"
            >
              {renderContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
