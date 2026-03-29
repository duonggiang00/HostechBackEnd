import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export interface SidebarDropdownItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
  exact?: boolean;
  badge?: number;
}

interface SidebarDropdownSectionProps {
  label: string;
  items?: SidebarDropdownItem[];
  children?: ReactNode;
  defaultOpen?: boolean;
  onNavigate?: () => void;
}

const isItemActive = (pathname: string, item: SidebarDropdownItem): boolean => {
  if (item.exact) {
    return pathname === item.path;
  }

  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

export default function SidebarDropdownSection({
  label,
  items = [],
  children,
  defaultOpen = false,
  onNavigate,
}: SidebarDropdownSectionProps) {
  const location = useLocation();
  const hasActiveItem = useMemo(
    () => items.some((item) => isItemActive(location.pathname, item)),
    [items, location.pathname],
  );
  const [open, setOpen] = useState(defaultOpen);
  const isExpanded = hasActiveItem || open;

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/20">
      <button
        type="button"
        onClick={() => {
          if (!hasActiveItem) {
            setOpen((current) => !current);
          }
        }}
        className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors ${
          isExpanded
            ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
            : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            isExpanded ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.16em]">{label}</p>
        </div>

        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 dark:text-slate-500"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-1 pb-1 pt-1.5">
              {items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.exact ?? false}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                      isActive
                        ? 'bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{item.label}</span>
                  {item.badge ? (
                    <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}

              {children ? <div className="pt-1">{children}</div> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
