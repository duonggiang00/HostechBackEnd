import { Home, ClipboardList, CreditCard, User, FileSignature } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function TenantNav() {
  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/app/dashboard' },
    { icon: FileSignature, label: 'Hợp đồng', path: '/app/contracts/pending' },
    { icon: ClipboardList, label: 'Yêu cầu', path: '/app/requests' },
    { icon: CreditCard, label: 'Hóa đơn', path: '/app/billing' },
    { icon: User, label: 'Cá nhân', path: '/app/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 px-6 py-3 pb-8 z-50 flex justify-between items-center sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 transition-all
            ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
          `}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
