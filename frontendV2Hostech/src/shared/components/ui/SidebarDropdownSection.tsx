import { type ReactNode, useState } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface SidebarDropdownItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
  exact?: boolean;
  badge?: number | string;
  children?: Omit<SidebarDropdownItem, 'icon'>[]; // Sub-items typically don't have full icons in Sneat, just dots
}

interface SidebarDropdownSectionProps {
  label: string;
  icon?: LucideIcon; // kept for backwards compat but unused at top level Sneat
  badge?: number;
  items?: SidebarDropdownItem[];
  children?: ReactNode;
  defaultOpen?: boolean;
  onNavigate?: () => void;
}

// Sneat style single NavLink item
function SidebarNavLink({ item, onNavigate, level = 0 }: { item: SidebarDropdownItem, onNavigate?: () => void, level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = item.exact 
    ? location.pathname === item.path 
    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

  const hasChildren = item.children && item.children.length > 0;
  
  const isChildActive = hasChildren && item.children!.some(child => 
    child.exact ? location.pathname === child.path : location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
  );

  const shouldBeOpen = isOpen || isChildActive;

  const content = (
    <>
      <div className={`flex items-center gap-3 flex-1 min-w-0 ${level > 0 ? 'pl-2' : ''}`}>
        {level === 0 ? (
          <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
        ) : (
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full border border-current ${isActive ? 'bg-current' : 'bg-transparent'}`} />
        )}
        <span className="truncate">{item.label}</span>
      </div>
      
      {item.badge && (
        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] uppercase font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
          {item.badge}
        </span>
      )}

      {hasChildren && (
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${shouldBeOpen ? 'rotate-180' : '-rotate-90'}`} />
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center justify-between px-4 py-[11px] mx-3 rounded-lg text-[15px] transition-colors ${
            shouldBeOpen || isChildActive
              ? 'bg-slate-100/50 text-slate-800 dark:bg-slate-800/50 dark:text-slate-200 font-medium'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
          }`}
        >
          {content}
        </button>

        <AnimatePresence initial={false}>
          {shouldBeOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1 pb-1">
                {item.children!.map((child) => (
                  <NavLink
                    key={child.id}
                    to={child.path}
                    end={child.exact ?? false}
                    onClick={onNavigate}
                    className={({ isActive: childActive }) =>
                      `group flex items-center justify-between px-4 py-[9px] mx-3 rounded-lg text-[14px] transition-colors ${
                        childActive
                          ? 'bg-indigo-50/80 text-indigo-700 font-medium dark:bg-indigo-500/10 dark:text-indigo-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive: childActive }) => (
                      <div className="flex items-center gap-3 flex-1 pl-4 min-w-0">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full border ${childActive ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-400 dark:border-indigo-400' : 'bg-transparent border-slate-400 dark:border-slate-500 group-hover:border-slate-600 dark:group-hover:border-slate-300'}`} />
                        <span className="truncate">{child.label}</span>
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.exact ?? false}
      onClick={onNavigate}
      className={({ isActive: linkActive }) =>
        `group flex items-center justify-between px-4 py-[11px] mx-3 rounded-lg text-[15px] transition-colors ${
          linkActive
            ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm ring-1 ring-indigo-100/50 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/20'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
        }`
      }
    >
      {content}
    </NavLink>
  );
}

export default function SidebarDropdownSection({
  label,
  items = [],
  children,
  onNavigate,
}: SidebarDropdownSectionProps) {
  if (items.length === 0 && !children) return null;

  return (
    <div className="mb-6">
      <div className="px-7 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center relative">
        <span className="relative z-10 bg-white dark:bg-slate-900 pr-2">{label}</span>
        <div className="absolute left-7 right-6 top-1/2 h-px bg-slate-200/60 dark:bg-slate-700/60" />
      </div>
      
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarNavLink key={item.id} item={item} onNavigate={onNavigate} />
        ))}
        {children ? <div className="px-3 pt-1">{children}</div> : null}
      </div>
    </div>
  );
}
