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
  label?: string;
  icon?: LucideIcon;
  badge?: number;
  items?: SidebarDropdownItem[];
  children?: ReactNode;
  defaultOpen?: boolean;
  onNavigate?: () => void;
  path?: string;
  isCollapsed?: boolean;
}

function SidebarNavLink({ item, onNavigate, level = 0, isCollapsed }: { item: SidebarDropdownItem, onNavigate?: () => void, level?: number, isCollapsed?: boolean }) {
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

  // Active styles based on DESIGN_SYSTEM.md
  // Default: text-gray-500
  // Hover: bg-gray-100 text-gray-900
  // Active: bg-blue-50 text-blue-900 border-l-4 border-blue-900
  const linkClasses = `group relative flex items-center justify-between py-2 transition-colors duration-200 outline-none
    ${isActive || isChildActive
      ? 'bg-slate-50 text-[#1E3A8A] border-l-4 border-[#1E3A8A]' 
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
    }
    ${isCollapsed ? 'px-0 justify-center' : 'px-4'}
  `;

  const renderIcon = () => {
    if (level === 0) {
      return (
        <item.icon 
          className={`h-5 w-5 shrink-0 transition-colors duration-200 
            ${isActive || isChildActive ? 'text-[#1E3A8A]' : 'text-gray-500 group-hover:text-gray-900'}
          `} 
          strokeWidth={isActive ? 2 : 1.5} 
        />
      );
    }
    return (
      <div className="flex w-5 items-center justify-center">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 
          ${isActive ? 'bg-[#1E3A8A]' : 'bg-gray-300 group-hover:bg-gray-500'}
        `} />
      </div>
    );
  };

  const content = (
    <>
      <div className={`flex items-center gap-3 flex-1 min-w-0 ${level > 0 ? 'pl-2' : ''} ${isCollapsed ? 'justify-center' : ''}`}>
        {renderIcon()}
        {!isCollapsed && (
          <span className={`truncate text-left text-[14px] transition-colors ${isActive ? 'font-medium' : 'font-normal'}`}>
            {item.label}
          </span>
        )}
      </div>
      
      {!isCollapsed && item.badge && (
        <span className="shrink-0 rounded-md bg-white border border-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-600 transition-colors">
          {item.badge}
        </span>
      )}

      {!isCollapsed && hasChildren && (
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${shouldBeOpen ? 'rotate-180 text-[#1E3A8A]' : '-rotate-90 text-gray-400'}`} />
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div className="flex flex-col mb-1">
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
                      ? (location.pathname + location.search) === child.path 
                      : (location.pathname + location.search).startsWith(child.path);

                    return (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        end={child.exact ?? false}
                        data-testid={`sidebar-item-${child.id}`}
                        onClick={onNavigate}
                        className={`group relative flex items-center justify-between px-4 py-2 transition-colors duration-200 outline-none
                          ${isChildCurrentlyActive
                            ? 'bg-slate-50 text-[#1E3A8A] border-l-4 border-[#1E3A8A]' 
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
                          }
                        `}
                      >
                        {() => (
                          <div className="flex items-center gap-3 flex-1 pl-12 min-w-0">
                            <div className="flex w-5 items-center justify-center">
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ${isChildCurrentlyActive ? 'bg-[#1E3A8A]' : 'bg-gray-300 group-hover:bg-gray-500'}`} />
                            </div>
                            <span className={`truncate text-left text-[14px] transition-colors ${isChildCurrentlyActive ? 'font-medium' : 'font-normal'}`}>{child.label}</span>
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
  isCollapsed = false
}: SidebarDropdownSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();

  if (items.length === 0 && !children) return null;

  const hasActiveItem = items.some(item => {
    const currentPath = location.pathname + location.search;
    return item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
  });

  // Keep sections open generally to mimic standard sidebars, unless explicitly toggled
  const shouldBeOpen = isOpen || hasActiveItem;

  const headerContent = !isCollapsed && label && (
    <>
      <div className="flex items-center gap-2.5 flex-1 relative">
        {Icon && <Icon className={`h-4 w-4 shrink-0 transition-colors ${shouldBeOpen ? 'text-[#1E3A8A]' : 'text-gray-400'}`} />}
        <span className={`relative z-10 bg-inherit transition-colors text-[11px] font-bold uppercase tracking-[0.1em] text-left ${shouldBeOpen ? 'text-[#1E3A8A]' : 'text-gray-400 group-hover:text-gray-600'}`}>
          {label}
        </span>
      </div>
      <ChevronDown 
        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${shouldBeOpen ? 'rotate-0 text-gray-900' : '-rotate-90 text-gray-400'}`} 
      />
    </>
  );

  const headerClassName = `w-full group px-4 mb-2 mt-4 text-xs flex items-center justify-between cursor-pointer rounded-lg py-2 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/50
    ${shouldBeOpen 
      ? 'bg-[#1E3A8A]/5 text-[#1E3A8A] shadow-sm' 
      : 'hover:bg-gray-50 text-gray-400'
    }
  `;

  const renderItems = (
    <div className={`space-y-0 text-[14px] ${!isCollapsed && label ? 'pl-4' : ''}`}>
      {items.map((item) => (
        <SidebarNavLink key={item.id} item={item} onNavigate={onNavigate} isCollapsed={isCollapsed} />
      ))}
      {children && !isCollapsed ? <div className="px-3 pt-1">{children}</div> : null}
    </div>
  );

  if (!label) {
    return <div className="mb-2 mt-4">{renderItems}</div>;
  }

  return (
    <div className="mb-2">
      {!isCollapsed && (
        path ? (
          <Link to={path} onClick={() => setIsOpen(true)} className={headerClassName}>
            {headerContent}
          </Link>
        ) : (
          <button type="button" onClick={() => setIsOpen(!isOpen)} className={headerClassName}>
            {headerContent}
          </button>
        )
      )}
      
      {isCollapsed && <div className="h-4" />} {/* Spacer when collapsed */}
      
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
