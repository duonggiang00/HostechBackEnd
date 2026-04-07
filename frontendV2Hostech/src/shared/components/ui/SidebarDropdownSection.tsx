import { type ReactNode, useState } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface SidebarDropdownItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
  exact?: boolean;
  badge?: number | string;
  children?: Omit<SidebarDropdownItem, 'icon'>[];
}

interface SidebarDropdownSectionProps {
  label: string;
  icon?: LucideIcon;
  badge?: number;
  items?: SidebarDropdownItem[];
  children?: ReactNode;
  defaultOpen?: boolean;
  onNavigate?: () => void;
  path?: string;
  showIcon?: boolean;
}

function SidebarNavLink({ item, onNavigate, level = 0 }: { item: SidebarDropdownItem, onNavigate?: () => void, level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = item.exact 
    ? (location.pathname + location.search) === item.path 
    : (location.pathname + location.search).startsWith(item.path);

  const hasChildren = item.children && item.children.length > 0;
  
  const isChildActive = hasChildren && item.children!.some(child => 
    child.exact 
      ? (location.pathname + location.search) === child.path 
      : (location.pathname + location.search).startsWith(child.path)
  );

  const shouldBeOpen = isOpen || isChildActive;

  const content = (
    <>
      <div className={`flex items-center gap-3.5 flex-1 min-w-0 ${level > 0 ? 'pl-2' : ''}`}>
        {level === 0 ? (
          <item.icon className={`h-4.5 w-4.5 shrink-0 transition-all duration-300 ${isActive || isChildActive ? 'text-brand-600 dark:text-brand-400 scale-110' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} strokeWidth={isActive ? 2.25 : 1.75} />
        ) : (
          <div className="flex w-4.5 items-center justify-center">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${isActive ? 'bg-brand-600 ring-4 ring-brand-500/20 dark:bg-brand-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
          </div>
        )}
        <span className={`truncate text-left tracking-tight transition-colors ${isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium'}`}>{item.label}</span>
      </div>
      
      {item.badge && (
        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
          {item.badge}
        </span>
      )}

      {hasChildren && (
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${shouldBeOpen ? 'rotate-180 text-indigo-500' : '-rotate-90 text-slate-400'}`} />
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex items-center justify-between px-4 py-[10px] mx-2 rounded-xl text-[0.875rem] transition-all duration-300 ${
            shouldBeOpen || isChildActive
              ? 'bg-brand-500/5 text-brand-700 dark:text-brand-300'
              : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
          }`}
        >
          {isActive && (
            <motion.span 
              layoutId="active-pill-dropdown"
              className="sidebar-active-pill"
            />
          )}
          {content}
        </button>

        <AnimatePresence initial={false}>
          {shouldBeOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
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
                      `group relative flex items-center justify-between px-4 py-[8px] mx-2 rounded-xl text-[0.8125rem] transition-all duration-300 ${
                        childActive
                          ? 'text-brand-700 dark:text-brand-300 bg-brand-500/5'
                          : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/20 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {() => (
                      <div className="flex items-center gap-3.5 flex-1 pl-4 min-w-0">
                        <div className="flex w-4.5 items-center justify-center">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-600 ring-4 ring-indigo-500/20 dark:bg-indigo-400 scale-110' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400'}`} />
                        </div>
                        <span className={`truncate text-left tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{child.label}</span>
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
      className={`group relative flex items-center justify-between px-4 py-[10px] mx-2 rounded-xl text-[0.875rem] transition-all duration-300 ${
        isActive
          ? 'bg-brand-500/5 text-brand-700 dark:text-brand-300'
          : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
      }`}
    >
      <>
        {isActive && (
          <motion.span 
            layoutId="active-pill-dropdown-single"
            className="sidebar-active-pill"
          />
        )}
        {content}
      </>
    </NavLink>
  );
}

export default function SidebarDropdownSection({
  label,
  items = [],
  children,
  onNavigate,
  defaultOpen = false,
  path,
}: SidebarDropdownSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();

  if (items.length === 0 && !children) return null;

  const hasActiveItem = items.some(item => {
    const currentPath = location.pathname + location.search;
    return item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
  });

  const shouldBeOpen = isOpen || hasActiveItem;

  const headerContent = (
    <>
      <div className="flex items-center flex-1 relative mr-4">
        <span className="relative z-10 bg-inherit pr-2 transition-colors group-hover:text-brand-500 uppercase text-[0.75rem] font-bold tracking-widest text-slate-400/80 text-left">
          {label}
        </span>
        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-200/40 dark:bg-slate-800/40" />
      </div>
      <ChevronDown 
        className={`h-3.5 w-3.5 shrink-0 transition-all duration-300 ${shouldBeOpen ? 'rotate-0 text-brand-500' : '-rotate-90 text-slate-300 group-hover:text-slate-500'}`} 
        strokeWidth={3}
      />
    </>
  );

  const headerClassName = "w-full group px-7 mb-3 text-[0.75rem] font-bold text-slate-400 uppercase flex items-center justify-between hover:text-indigo-500 transition-all duration-200 cursor-pointer tracking-widest";

  return (
    <div className="mb-6">
      {path ? (
        <Link to={path} onClick={() => setIsOpen(true)} className={headerClassName}>
          {headerContent}
        </Link>
      ) : (
        <button type="button" onClick={() => setIsOpen(!isOpen)} className={headerClassName}>
          {headerContent}
        </button>
      )}
      
      <AnimatePresence initial={false}>
        {shouldBeOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5">
              {items.map((item) => (
                <SidebarNavLink key={item.id} item={item} onNavigate={onNavigate} />
              ))}
              {children ? <div className="px-3 pt-1.5">{children}</div> : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
