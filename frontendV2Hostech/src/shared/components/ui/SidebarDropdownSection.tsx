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

export type SidebarNavVariant = 'default' | 'darkConsole';

interface SidebarDropdownSectionProps {
  label?: string;
  icon?: LucideIcon;
  badge?: number;
  items?: SidebarDropdownItem[];
  children?: ReactNode;
  defaultOpen?: boolean;
  onNavigate?: () => void;
  path?: string;
  isCollapsed?: boolean;
  navVariant?: SidebarNavVariant;
}

function SidebarNavLink({
  item,
  onNavigate,
  level = 0,
  isCollapsed,
  navVariant = 'default',
}: {
  item: SidebarDropdownItem;
  onNavigate?: () => void;
  level?: number;
  isCollapsed?: boolean;
  navVariant?: SidebarNavVariant;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = item.exact
    ? location.pathname + location.search === item.path
    : (location.pathname + location.search).startsWith(item.path);

  const hasChildren = item.children && item.children.length > 0;

  const isChildActive =
    hasChildren &&
    item.children!.some((child) =>
      child.exact
        ? location.pathname + location.search === child.path
        : (location.pathname + location.search).startsWith(child.path),
    );

  const shouldBeOpen = isOpen || isChildActive;

  const isDarkNav = navVariant === 'darkConsole';
  const linkClasses = `group relative flex items-center justify-between py-2 transition-colors duration-200 outline-none
    ${
      isActive || isChildActive
        ? isDarkNav
          ? 'border-l-4 border-emerald-500 bg-emerald-500/15 text-emerald-100'
          : 'border-l-4 border-indigo-700 bg-slate-50 text-indigo-700'
        : isDarkNav
          ? 'border-l-4 border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100'
          : 'border-l-4 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }
    ${isCollapsed ? 'justify-center px-0' : 'px-4'}
  `;

  const renderIcon = () => {
    if (level === 0) {
      return (
        <item.icon
          className={`h-5 w-5 shrink-0 transition-colors duration-200
            ${
              isActive || isChildActive
                ? isDarkNav
                  ? 'text-emerald-300'
                  : 'text-indigo-700'
                : isDarkNav
                  ? 'text-slate-500 group-hover:text-slate-200'
                  : 'text-slate-500 group-hover:text-slate-900'
            }
          `}
          strokeWidth={isActive ? 2 : 1.5}
        />
      );
    }
    return (
      <div className="flex w-5 items-center justify-center">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200
          ${
            isActive
              ? isDarkNav
                ? 'bg-emerald-400'
                : 'bg-indigo-700'
              : isDarkNav
                ? 'bg-slate-600 group-hover:bg-slate-400'
                : 'bg-slate-300 group-hover:bg-slate-500'
          }
        `}
        />
      </div>
    );
  };

  const content = (
    <>
      <div className={`flex min-w-0 flex-1 items-center gap-3 ${level > 0 ? 'pl-2' : ''} ${isCollapsed ? 'justify-center' : ''}`}>
        {renderIcon()}
        {!isCollapsed && (
          <span className={`truncate text-left text-sm transition-colors ${isActive ? 'font-medium' : 'font-normal'}`}>
            {item.label}
          </span>
        )}
      </div>

      {!isCollapsed && item.badge && (
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-colors ${
            isDarkNav
              ? 'border border-white/10 bg-white/5 text-slate-200'
              : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          {item.badge}
        </span>
      )}

      {!isCollapsed && hasChildren && (
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            shouldBeOpen
              ? isDarkNav
                ? 'rotate-180 text-emerald-400'
                : 'rotate-180 text-indigo-700'
              : '-rotate-90 text-slate-400'
          }`}
        />
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div className="mb-1 flex flex-col">
        <button
          type="button"
          data-testid={`sidebar-item-${item.id}`}
          onClick={() => {
            if (!isCollapsed) setIsOpen(!isOpen);
          }}
          className={linkClasses}
          title={isCollapsed ? item.label : undefined}
        >
          {content}
        </button>

        {!isCollapsed && (
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
                  {item.children!.map((child) => {
                    const isChildCurrentlyActive = child.exact
                      ? location.pathname + location.search === child.path
                      : (location.pathname + location.search).startsWith(child.path);

                    return (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        end={child.exact ?? false}
                        data-testid={`sidebar-item-${child.id}`}
                        onClick={onNavigate}
                        className={`group relative flex items-center justify-between px-4 py-2 transition-colors duration-200 outline-none
                          ${
                            isChildCurrentlyActive
                              ? isDarkNav
                                ? 'border-l-4 border-emerald-500 bg-emerald-500/15 text-emerald-100'
                                : 'border-l-4 border-indigo-700 bg-slate-50 text-indigo-700'
                              : isDarkNav
                                ? 'border-l-4 border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                : 'border-l-4 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          }
                        `}
                      >
                        {() => (
                          <div className="flex min-w-0 flex-1 items-center gap-3 pl-12">
                            <div className="flex w-5 items-center justify-center">
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ${
                                  isChildCurrentlyActive
                                    ? isDarkNav
                                      ? 'bg-emerald-400'
                                      : 'bg-indigo-800'
                                    : isDarkNav
                                      ? 'bg-slate-600 group-hover:bg-slate-400'
                                      : 'bg-slate-300 group-hover:bg-slate-500'
                                }`}
                              />
                            </div>
                            <span
                              className={`truncate text-left text-sm transition-colors ${isChildCurrentlyActive ? 'font-medium' : 'font-normal'}`}
                            >
                              {child.label}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.exact ?? false}
      data-testid={`sidebar-item-${item.id}`}
      onClick={onNavigate}
      className={`${linkClasses} mb-1`}
      title={isCollapsed ? item.label : undefined}
    >
      {content}
    </NavLink>
  );
}

export default function SidebarDropdownSection({
  label,
  icon: Icon,
  items = [],
  children,
  onNavigate,
  defaultOpen = true,
  path,
  isCollapsed = false,
  navVariant = 'default',
}: SidebarDropdownSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();

  if (items.length === 0 && !children) return null;

  const hasActiveItem = items.some((item) => {
    const currentPath = location.pathname + location.search;
    return item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
  });

  const shouldBeOpen = isOpen || hasActiveItem;
  const isDark = navVariant === 'darkConsole';

  const headerContent = !isCollapsed && label && (
    <>
      <div className="relative flex flex-1 items-center gap-2.5">
        {Icon && (
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              shouldBeOpen ? (isDark ? 'text-emerald-400' : 'text-indigo-700') : isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          />
        )}
        <span
          className={`relative z-10 bg-inherit text-left text-[0.7rem] font-bold uppercase tracking-[0.1em] transition-colors ${
            shouldBeOpen
              ? isDark
                ? 'text-emerald-300'
                : 'text-indigo-700'
              : isDark
                ? 'text-slate-500 group-hover:text-slate-300'
                : 'text-slate-400 group-hover:text-slate-600'
          }`}
        >
          {label}
        </span>
      </div>
      <ChevronDown
        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
          shouldBeOpen ? (isDark ? 'rotate-0 text-emerald-300' : 'rotate-0 text-slate-900') : '-rotate-90 text-slate-400'
        }`}
      />
    </>
  );

  const headerClassName = `group mb-2 mt-4 flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-2 text-xs transition-all duration-300 outline-none focus-visible:ring-2 ${
    isDark ? 'focus-visible:ring-emerald-500/40' : 'focus-visible:ring-indigo-700/50'
  }
    ${
      shouldBeOpen
        ? isDark
          ? 'bg-emerald-500/10 text-emerald-200 shadow-sm'
          : 'bg-indigo-700/5 text-indigo-700 shadow-sm'
        : isDark
          ? 'text-slate-500 hover:bg-white/5'
          : 'text-slate-400 hover:bg-slate-50'
    }
  `;

  const renderItems = (
    <div className={`space-y-0 text-[14px] ${!isCollapsed && label ? 'pl-4' : ''}`}>
      {items.map((item) => (
        <SidebarNavLink key={item.id} item={item} onNavigate={onNavigate} isCollapsed={isCollapsed} navVariant={navVariant} />
      ))}
      {children && !isCollapsed ? <div className="px-3 pt-1">{children}</div> : null}
    </div>
  );

  if (!label) {
    return <div className="mb-2 mt-4">{renderItems}</div>;
  }

  return (
    <div className="mb-2">
      {!isCollapsed &&
        (path ? (
          <Link to={path} onClick={() => setIsOpen(true)} className={headerClassName}>
            {headerContent}
          </Link>
        ) : (
          <button type="button" onClick={() => setIsOpen(!isOpen)} className={headerClassName}>
            {headerContent}
          </button>
        ))}

      {isCollapsed && <div className="h-4" />}

      <AnimatePresence initial={false}>
        {(shouldBeOpen || isCollapsed) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {renderItems}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
