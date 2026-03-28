import { Home, ClipboardList, CreditCard, User, FileSignature } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import SidebarAccountMenu from '@/shared/components/ui/SidebarAccountMenu';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

const navItems = [
  { icon: Home, label: 'Tổng quan', path: '/app/dashboard', desc: 'Việc cần làm và cập nhật mới nhất' },
  { icon: FileSignature, label: 'Hợp đồng', path: '/app/contracts/pending', desc: 'Ký điện tử và xem chi tiết hợp đồng' },
  { icon: ClipboardList, label: 'Yêu cầu', path: '/app/requests', desc: 'Gửi và theo dõi yêu cầu hỗ trợ' },
  { icon: CreditCard, label: 'Hóa đơn', path: '/app/billing', desc: 'Thanh toán và tra cứu công nợ' },
];

const accountItem = { icon: User, label: 'Tài khoản', path: '/app/profile' };

export default function TenantNav() {
  const { user, logout } = useAuthStore();

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:h-screen lg:sticky lg:top-0 bg-[#0f172a] text-white border-r border-slate-800 px-5 py-6">
        <div className="mb-8 px-3">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-500">Website cư dân</p>
          <h2 className="text-2xl font-black tracking-tight mt-3">Cổng cư dân</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Ưu tiên ký hợp đồng, thanh toán và theo dõi các yêu cầu đang xử lý.
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-start gap-4 rounded-3xl px-4 py-4 transition-all border ${
                  isActive
                    ? 'bg-white text-slate-900 border-white shadow-lg shadow-black/10'
                    : 'border-transparent text-slate-300 hover:bg-white/5 hover:border-slate-700'
                }`
              }
            >
              <div className="mt-0.5">
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wider">{item.label}</p>
                <p className="text-xs mt-1 leading-relaxed opacity-75">{item.desc}</p>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <SidebarAccountMenu
            profilePath="/app/profile"
            userName={user?.full_name}
            role={user?.role}
            onLogout={logout}
            tone="dark"
          />
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-4 py-3 z-50 flex justify-between items-center lg:hidden">
        {[...navItems, accountItem].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1.5 transition-all min-w-[56px]
              ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
