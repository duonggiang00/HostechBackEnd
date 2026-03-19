import { Home, ClipboardList, CreditCard, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function TenantNav() {
  const navItems = [
    { icon: Home, label: 'Home', path: '/app/dashboard' },
    { icon: ClipboardList, label: 'Requests', path: '/app/requests' },
    { icon: CreditCard, label: 'Billing', path: '/app/billing' },
    { icon: User, label: 'Profile', path: '/app/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 pb-8 z-50 flex justify-between items-center sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 transition-all
            ${isActive ? 'text-indigo-600' : 'text-slate-400'}
          `}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
