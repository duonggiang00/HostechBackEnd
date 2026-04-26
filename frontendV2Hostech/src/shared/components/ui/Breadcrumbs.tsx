import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbLabel } from '@/shared/configs/navigation.config';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Không hiển thị breadcrumbs ở trang chủ hoặc các trang root
  if (pathnames.length <= 1) return null;

  return (
    <nav className="flex mb-4 overflow-x-auto scrollbar-hide shrink-0" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 md:space-x-2 whitespace-nowrap">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-2" />
            Hostech
          </Link>
        </li>
        
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          // Ưu tiên lấy label từ config, nếu không có thì lấy string thô
          const labelFromConfig = getBreadcrumbLabel(to);
          
          // Xử lý các trường hợp đặc biệt như IDs (uuid)
          const isId = /^[0-9a-fA-F-]{36}$/.test(value) || /^\d+$/.test(value);
          const label = labelFromConfig || (isId ? 'Chi tiết' : value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' '));

          if (label === 'Hostech' || label === '') return null;

          return (
            <li key={to} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-slate-300 mx-1 shrink-0" />
              {last ? (
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {label}
                </span>
              ) : (
                <Link
                  to={to}
                  className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors capitalize"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
