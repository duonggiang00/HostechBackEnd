import { Clock, CheckCircle, XCircle, Send, Lock } from 'lucide-react';
import type { MeterReadingStatus } from '../types';

interface ReadingStatusBadgeProps {
  status: MeterReadingStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<MeterReadingStatus, {
  label: string;
  icon: React.FC<{ className?: string }>;
  className: string;
}> = {
  DRAFT: {
    label: 'Nháp',
    icon: Clock,
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  SUBMITTED: {
    label: 'Chờ duyệt',
    icon: Send,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
  APPROVED: {
    label: 'Đã duyệt',
    icon: CheckCircle,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Từ chối',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
  LOCKED: {
    label: 'Đã khóa',
    icon: Lock,
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  },
};

export function ReadingStatusBadge({ status, size = 'sm' }: ReadingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  const sizeClasses = size === 'md'
    ? 'px-2.5 py-1 text-xs gap-1.5'
    : 'px-2 py-0.5 text-[10px] gap-1';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full leading-none transition-colors ${sizeClasses} ${config.className}`}
      title={config.label}
    >
      <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      {config.label}
    </span>
  );
}
