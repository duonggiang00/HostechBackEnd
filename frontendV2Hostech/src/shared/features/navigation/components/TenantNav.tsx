import { ClipboardList, CreditCard, FileSignature, Home, Layers, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import SidebarAccountMenu from '@/shared/components/ui/SidebarAccountMenu';
import SidebarDropdownSection from '@/shared/components/ui/SidebarDropdownSection';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

const navItems = [
  { icon: Home, label: 'Tổng quan', path: '/app/dashboard' },
  { icon: FileSignature, label: 'Hợp đồng', path: '/app/contracts/pending' },
  { icon: CreditCard, label: 'Hóa đơn', path: '/app/billing' },
  { icon: ClipboardList, label: 'Yêu cầu', path: '/app/requests' },
  { icon: Layers, label: 'Sơ đồ tòa nhà', path: '/app/building-overview' },
];

const navSections = [
  {
    id: 'residence',
    label: 'Chỗ ở',
    defaultOpen: true,
    items: [
      { id: 'dashboard', icon: Home, label: 'Tổng quan', path: '/app/dashboard', exact: true },
      { id: 'contracts', icon: FileSignature, label: 'Hợp đồng', path: '/app/contracts/pending' },
      { id: 'building-overview', icon: Layers, label: 'Sơ đồ tòa nhà', path: '/app/building-overview' },
    ],
  },
  {
    id: 'services',
    label: 'Tài chính và hỗ trợ',
    items: [
      { id: 'billing', icon: CreditCard, label: 'Hóa đơn', path: '/app/billing' },
      { id: 'requests', icon: ClipboardList, label: 'Yêu cầu', path: '/app/requests' },
    ],
  },
];

const accountItem = { icon: User, label: 'Tài khoản', path: '/app/profile' };

export default function TenantNav() {
  const { user, logout } = useAuthStore();

  return (
    <>
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white/90 lg:px-4 lg:py-5 lg:backdrop-blur dark:lg:border-slate-800 dark:lg:bg-slate-950/85">
        <div className="px-3">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
            Cổng cư dân
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Hostech
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Các thao tác chính đã được gom theo từng nhóm để dễ tìm hơn.
          </p>
        </div>

        <nav className="mt-6 flex-1 space-y-3">
          {navSections.map((section) => (
            <SidebarDropdownSection
              key={section.id}
              label={section.label}
              items={section.items}
              defaultOpen={section.defaultOpen}
            />
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
