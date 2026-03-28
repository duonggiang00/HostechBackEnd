import { CheckCircle2, Clock, AlertCircle, Ban, FileText, CreditCard } from 'lucide-react';
import type { InvoiceStatus } from '../types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  DRAFT: {
    label: 'Nháp',
    icon: <FileText className="w-3 h-3" />,
    className:
      'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600',
  },
  ISSUED: {
    label: 'Đã phát hành',
    icon: <Clock className="w-3 h-3" />,
    className:
      'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
  },
  PAID: {
    label: 'Đã thanh toán',
    icon: <CheckCircle2 className="w-3 h-3" />,
    className:
      'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
  },
  PARTIALLY_PAID: {
    label: 'Thanh toán 1 phần',
    icon: <CreditCard className="w-3 h-3" />,
    className:
      'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30',
  },
  OVERDUE: {
    label: 'Quá hạn',
    icon: <AlertCircle className="w-3 h-3" />,
    className:
      'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: <Ban className="w-3 h-3" />,
    className:
      'bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 line-through',
  },
};

export function InvoiceStatusBadge({ status, size = 'sm' }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const sizeClass = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-widest ${sizeClass} ${config.className} transition-colors`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
