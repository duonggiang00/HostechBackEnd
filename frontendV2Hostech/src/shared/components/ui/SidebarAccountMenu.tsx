import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarAccountMenuProps {
  profilePath?: string;
  userName?: string | null;
  role?: string | null;
  onLogout: () => void;
  onActionComplete?: () => void;
  isCollapsed?: boolean;
}

export default function SidebarAccountMenu({
  profilePath,
  userName,
  role,
  onLogout,
  onActionComplete,
  isCollapsed = false
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

  const handleLogout = () => {
    setOpen(false);
    onLogout();
    onActionComplete?.();
  };

  // Color mappings based on Design System
  const triggerClasses = isCollapsed 
    ? "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 justify-center transition-colors"
    : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 outline-none";
    
  const menuClasses = "border border-gray-200 bg-white text-gray-900 shadow-lg";
  const menuItemClasses = "text-gray-600 hover:bg-gray-100 hover:text-gray-900 outline-none";
  const separatorClasses = "bg-gray-200";
  const avatarClasses = "bg-blue-100 text-blue-900 border border-blue-200";
  const roleClasses = "text-gray-400";

  return (
    <div ref={menuRef} className="relative w-full">
      {open && !isCollapsed ? (
        <div className={`absolute bottom-[calc(100%+8px)] left-0 z-50 w-full origin-bottom rounded-xl p-1.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${menuClasses}`}>
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
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 outline-none"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Đăng xuất</span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => !isCollapsed ? setOpen((current) => !current) : handleNavigateProfile()}
        className={`group flex w-full items-center gap-3 rounded-lg py-2 transition-colors duration-200 ${isCollapsed ? 'px-0 justify-center hover:bg-gray-100' : 'px-2'} ${triggerClasses}`}
        title={isCollapsed ? "Cài đặt & Tài khoản" : undefined}
      >
        <div className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase relative ${avatarClasses}`}>
          {userName?.[0] || <User className="h-4 w-4" />}
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
        </div>

        {!isCollapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-gray-900">{userName || 'Khách'}</p>
              <p className={`mt-0.5 truncate text-[12px] font-medium capitalize ${roleClasses}`}>
                {role?.replace('_', ' ') || 'Chưa phân quyền'}
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-center text-gray-400 group-hover:text-gray-600">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </>
        )}
      </button>
    </div>
  );
}
