import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SidebarAccountMenuTone = 'light' | 'dark';

interface SidebarAccountMenuProps {
  profilePath: string;
  userName?: string | null;
  role?: string | null;
  onLogout: () => void;
  onActionComplete?: () => void;
  tone?: SidebarAccountMenuTone;
}

export default function SidebarAccountMenu({
  profilePath,
  userName,
  role,
  onLogout,
  onActionComplete,
  tone = 'light',
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
    navigate(profilePath);
    setOpen(false);
    onActionComplete?.();
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout();
    onActionComplete?.();
  };

  const triggerClasses = tone === 'dark'
    ? 'bg-slate-950/80 border-slate-800 text-white hover:border-slate-600 hover:bg-slate-900/90'
    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-indigo-200 dark:hover:border-indigo-700';

  const menuClasses = tone === 'dark'
    ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-black/30'
    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-slate-900/10';

  const menuItemClasses = tone === 'dark'
    ? 'text-slate-200 hover:bg-white/5'
    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60';

  const separatorClasses = tone === 'dark' ? 'bg-slate-800' : 'bg-slate-100 dark:bg-slate-700';
  const avatarClasses = tone === 'dark'
    ? 'bg-white/10 text-white'
    : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400';
  const roleClasses = tone === 'dark' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400';

  return (
    <div ref={menuRef} className="relative w-full">
      {open ? (
        <div className={`absolute bottom-full left-0 z-50 mb-2 w-full rounded-2xl border p-2 shadow-2xl ${menuClasses}`}>
          <button
            type="button"
            onClick={handleNavigateProfile}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${menuItemClasses}`}
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span className="truncate">Xem chi tiết tài khoản</span>
          </button>

          <button
            type="button"
            onClick={handleNavigateProfile}
            className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${menuItemClasses}`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="truncate">Chỉnh sửa thông tin</span>
          </button>

          <div className={`my-2 h-px ${separatorClasses}`} />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-500 transition-colors hover:bg-rose-50/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Đăng xuất</span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left shadow-sm transition-all ${triggerClasses}`}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-inner uppercase ${avatarClasses}`}>
          {userName?.[0] || 'U'}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{userName || 'Guest'}</p>
          <p className={`truncate text-xs font-medium capitalize ${roleClasses}`}>{role?.replace('_', ' ') || 'No Role'}</p>
        </div>

        {open ? <ChevronDown className="h-4 w-4 shrink-0 opacity-70" /> : <ChevronUp className="h-4 w-4 shrink-0 opacity-70" />}
      </button>
    </div>
  );
}
