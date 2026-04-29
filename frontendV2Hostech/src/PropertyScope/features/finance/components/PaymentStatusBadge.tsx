import type { PaymentStatus } from '../types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING:  { label: 'Chờ duyệt',   className: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' },
  APPROVED: { label: 'Hoàn thành',  className: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' },
  REJECTED: { label: 'Từ chối',     className: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' },
  VOIDED:   { label: 'Đã hủy',      className: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 line-through' },
};

export function PaymentStatusBadge({ status, size = 'sm' }: PaymentStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
