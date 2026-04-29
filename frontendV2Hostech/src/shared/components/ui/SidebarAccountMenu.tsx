import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type SidebarAccountVariant = 'default' | 'darkConsole';

interface SidebarAccountMenuProps {
  profilePath?: string;
  userName?: string | null;
  role?: string | null;
  onLogout: () => void | Promise<void>;
  onActionComplete?: () => void;
  isCollapsed?: boolean;
  variant?: SidebarAccountVariant;
}

export default function SidebarAccountMenu({
  profilePath,
  userName,
  role,
  onLogout,
  onActionComplete,
  isCollapsed = false,
  variant = 'default',
}: SidebarAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateProfile = () => {
    if (profilePath) {
      navigate(profilePath);
    }
    setOpen(false);
    onActionComplete?.();
  };

  const handleLogout = async () => {
    setOpen(false);
    await onLogout();
    onActionComplete?.();
  };

  const isDark = variant === 'darkConsole';

  const triggerClasses = isCollapsed
    ? isDark
      ? 'justify-center bg-transparent text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100'
      : 'justify-center bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900'
    : isDark
      ? 'bg-transparent text-slate-300 outline-none hover:bg-white/10 hover:text-white'
      : 'bg-transparent text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900';

  const menuClasses = isDark
    ? 'border border-white/10 bg-[#141416] text-slate-100 shadow-xl shadow-black/40'
    : 'border border-gray-200 bg-white text-gray-900 shadow-lg';
  const menuItemClasses = isDark
    ? 'text-slate-300 outline-none hover:bg-white/10 hover:text-white'
    : 'text-gray-600 outline-none hover:bg-gray-100 hover:text-gray-900';
  const separatorClasses = isDark ? 'bg-white/10' : 'bg-gray-200';
  const avatarClasses = isDark
    ? 'border border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
    : 'border border-blue-200 bg-blue-100 text-blue-900';
  const roleClasses = isDark ? 'text-slate-500' : 'text-gray-400';
  const nameClasses = isDark ? 'text-slate-100' : 'text-gray-900';
  const chevronClasses = isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-gray-400 group-hover:text-gray-600';

  return (
    <div ref={menuRef} className="relative w-full">
      {open && !isCollapsed ? (
        <div
          className={`absolute bottom-[calc(100%+8px)] left-0 z-50 w-full origin-bottom rounded-xl p-1.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${menuClasses}`}
        >
          <button
            type="button"
            onClick={handleNavigateProfile}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition-colors ${menuItemClasses}`}
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span className="truncate">Tài khoản</span>
          </button>

          <button
            type="button"
            onClick={handleNavigateProfile}
            className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition-colors ${menuItemClasses}`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="truncate">Cài đặt</span>
          </button>

          <div className={`my-1.5 h-px ${separatorClasses}`} />

          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] outline-none ${
              isDark
                ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Đăng xuất</span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (!isCollapsed ? setOpen((current) => !current) : handleNavigateProfile())}
        className={`group flex w-full items-center gap-3 rounded-lg py-2 transition-colors duration-200 ${
          isCollapsed ? (isDark ? 'justify-center px-0 hover:bg-white/10' : 'justify-center px-0 hover:bg-gray-100') : 'px-2'
        } ${triggerClasses}`}
        title={isCollapsed ? 'Cài đặt & Tài khoản' : undefined}
      >
        <div className={`relative flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${avatarClasses}`}>
          {userName?.[0] || <User className="h-4 w-4" />}
          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500 ${
              isDark ? 'border-[#141416]' : 'border-white'
            }`}
          />
        </div>

        {!isCollapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[14px] font-semibold ${nameClasses}`}>{userName || 'Khách'}</p>
              <p className={`mt-0.5 truncate text-[12px] font-medium capitalize ${roleClasses}`}>
                {role?.replace('_', ' ') || 'Chưa phân quyền'}
              </p>
            </div>

            <div className={`flex shrink-0 items-center justify-center ${chevronClasses}`}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </>
        )}
      </button>
    </div>
  );
}
