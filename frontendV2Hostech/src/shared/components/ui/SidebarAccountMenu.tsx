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

  const triggerClasses =
    tone === 'dark'
      ? 'bg-transparent text-slate-300 hover:bg-slate-800'
      : 'bg-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50';

  const menuClasses =
    tone === 'dark'
      ? 'border border-slate-700 bg-slate-800 text-slate-100 shadow-xl'
      : 'border border-slate-200 bg-white text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';

  const menuItemClasses =
    tone === 'dark'
      ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-white';

  const separatorClasses = tone === 'dark' ? 'bg-slate-700' : 'bg-slate-100 dark:bg-slate-700';
  
  const avatarClasses =
    tone === 'dark'
      ? 'bg-indigo-500/20 text-indigo-400'
      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300';
  
  const roleClasses = tone === 'dark' ? 'text-slate-400' : 'text-slate-400 dark:text-slate-400';

  return (
    <div ref={menuRef} className="relative w-full">
      {open ? (
        <div className={`absolute bottom-[calc(100%+8px)] left-0 z-50 w-full origin-bottom rounded-lg p-2 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${menuClasses}`}>
          <button
            type="button"
            onClick={handleNavigateProfile}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${menuItemClasses}`}
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span className="truncate">Tài khoản</span>
          </button>

          <button
            type="button"
            onClick={handleNavigateProfile}
            className={`mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${menuItemClasses}`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="truncate">Cài đặt</span>
          </button>

          <div className={`my-2 h-px ${separatorClasses}`} />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Đăng xuất</span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-200 ${triggerClasses}`}
      >
        <div className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase relative ${avatarClasses}`}>
          {userName?.[0] || 'U'}
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-slate-800" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-slate-700 dark:text-slate-200">{userName || 'Guest'}</p>
          <p className={`mt-0.5 truncate text-[12px] font-medium capitalize ${roleClasses}`}>
            {role?.replace('_', ' ') || 'No Role'}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
    </div>
  );
}
