import { ClipboardList, CreditCard, FileSignature, Home, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import SidebarAccountMenu from '@/shared/components/ui/SidebarAccountMenu';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

const navItems = [
  { icon: Home, label: 'Tổng quan', path: '/app/dashboard' },
  { icon: FileSignature, label: 'Hợp đồng', path: '/app/contracts/pending' },
  { icon: CreditCard, label: 'Hóa đơn', path: '/app/billing' },
  { icon: ClipboardList, label: 'Yêu cầu', path: '/app/requests' },
];

const accountItem = { icon: User, label: 'Tài khoản', path: '/app/profile' };

export default function TenantNav() {
  const { user, logout } = useAuthStore();

  return (
    <>
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white/90 lg:px-5 lg:py-6 lg:backdrop-blur dark:lg:border-slate-800 dark:lg:bg-slate-950/85">
        <div className="px-3">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
            Cổng cư dân
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Hostech
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Mọi thao tác chính đều nằm ở đây.
          </p>
        </div>

        <nav className="mt-8 flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <SidebarAccountMenu
            profilePath="/app/profile"
            userName={user?.full_name}
            role={user?.role}
            onLogout={logout}
          />
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
        {[...navItems, accountItem].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex min-w-[60px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}