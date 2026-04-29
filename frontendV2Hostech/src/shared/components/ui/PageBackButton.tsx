import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type PageBackButtonVariant = 'default' | 'inverse';

export interface PageBackButtonProps {
  label?: string;
  className?: string;
  /** React Router `Link` — dùng khi cần đích cố định (vd. tenant về dashboard) */
  to?: string;
  /** Ghi đè `navigate(-1)` khi không có `to` */
  onBack?: () => void;
  disabled?: boolean;
  /** `inverse`: nền tối (vd. hero tenant) */
  variant?: PageBackButtonVariant;
}

export function PageBackButton({
  label = 'Quay lại',
  className,
  to,
  onBack,
  disabled,
  variant = 'default',
}: PageBackButtonProps) {
  const navigate = useNavigate();

  const rootDefault =
    'inline-flex items-center gap-2 rounded-lg py-2 pl-1 pr-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';
  const rootInverse =
    'inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50';

  const root =
    variant === 'inverse'
      ? cn(rootInverse, className)
      : cn(
          rootDefault,
          'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-slate-400/30',
          className
        );

  const iconClass =
    variant === 'inverse'
      ? 'h-4 w-4 shrink-0 text-white/90'
      : 'h-[18px] w-[18px] shrink-0 text-slate-500 dark:text-slate-400';

  const content = (
    <>
      <ArrowLeft className={iconClass} strokeWidth={2} />
      <span>{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={root} aria-disabled={disabled ?? false}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(root, variant === 'default' && '-ml-1')}
      onClick={() => {
        if (onBack) onBack();
        else navigate(-1);
      }}
    >
      {content}
    </button>
  );
}
