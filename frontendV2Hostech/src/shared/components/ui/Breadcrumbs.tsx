import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbLabel } from '@/shared/configs/navigation.config';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

type BreadcrumbTone = 'light' | 'darkConsole';

interface BreadcrumbsProps {
  tone?: BreadcrumbTone;
}

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default function Breadcrumbs({ tone = 'light' }: BreadcrumbsProps) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const hasRole = useAuthStore((s) => s.hasRole);

  const isDark = tone === 'darkConsole';
  const rootLink = isDark
    ? 'inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors'
    : 'inline-flex items-center text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors';
  const chevron = isDark ? 'w-4 h-4 text-slate-600 mx-1 shrink-0' : 'w-4 h-4 text-slate-300 mx-1 shrink-0';
  const current = isDark
    ? 'text-xs font-black text-white uppercase tracking-wide'
    : 'text-xs font-black text-slate-800 dark:text-white';
  const link = isDark
    ? 'text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors capitalize'
    : 'text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors capitalize';

  // Không hiển thị breadcrumbs ở trang chủ hoặc các trang root
  if (pathnames.length <= 1) return null;

  return (
    <nav className="flex mb-4 overflow-x-auto scrollbar-hide shrink-0" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 md:space-x-2 whitespace-nowrap">
        <li className="inline-flex items-center">
          <Link to="/" className={rootLink}>
            <Home className="w-3.5 h-3.5 mr-2" />
            Hostech
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const pathForLabel = `/${pathnames.slice(0, index + 1).join('/')}`;
          let to = pathForLabel;

          // /properties/:propertyId là route index → redirect dashboard. Khi còn segment sau (vd. handovers),
          // không được link tới URL 2 segment đó; dùng trang landing trong phạm vi tòa.
          if (
            index === 1 &&
            pathnames[0] === 'properties' &&
            UUID_RE.test(pathnames[1] ?? '') &&
            pathnames.length > 2
          ) {
            const landing = hasRole(['Staff']) ? 'staff-home' : 'dashboard';
            to = `/properties/${pathnames[1]}/${landing}`;
          }

          const labelFromConfig = getBreadcrumbLabel(pathForLabel);

          const isId = /^[0-9a-fA-F-]{36}$/.test(value) || /^\d+$/.test(value);
          const label = labelFromConfig || (isId ? 'Chi tiết' : value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' '));

          if (label === 'Hostech' || label === '') return null;

          return (
            <li key={`${index}-${pathForLabel}`} className="flex items-center">
              <ChevronRight className={chevron} />
              {last ? (
                <span className={current}>{label}</span>
              ) : (
                <Link to={to} className={link}>
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
