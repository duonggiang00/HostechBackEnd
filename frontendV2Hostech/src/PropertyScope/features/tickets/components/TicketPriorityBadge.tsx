import type { TicketPriority } from '../types';

interface Props {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; class: string; dot: string }> = {
  LOW:    { label: 'Thấp',  class: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
  MEDIUM: { label: 'TB',    class: 'text-blue-600 dark:text-blue-400',   dot: 'bg-blue-500' },
  HIGH:   { label: 'Cao',   class: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  URGENT: { label: 'Khẩn', class: 'text-rose-600 dark:text-rose-400',   dot: 'bg-rose-500' },
};

export default function TicketPriorityBadge({ priority, size = 'md' }: Props) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  const sizeClass = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-bold ${sizeClass} ${config.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
