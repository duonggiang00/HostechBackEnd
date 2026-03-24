import type { TicketStatus } from '../types';

interface Props {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; class: string }> = {
  OPEN: { label: 'Mở', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  RECEIVED: { label: 'Đã nhận', class: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  IN_PROGRESS: { label: 'Đang xử lý', class: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  WAITING_PARTS: { label: 'Chờ linh kiện', class: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' },
  DONE: { label: 'Hoàn thành', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  CANCELLED: { label: 'Đã hủy', class: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
};

export default function TicketStatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-bold rounded-full uppercase tracking-wide ${sizeClass} ${config.class}`}>
      {config.label}
    </span>
  );
}
