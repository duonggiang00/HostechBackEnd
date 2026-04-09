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
      'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]',
  },
  ISSUED: {
    label: 'Đã phát hành',
    icon: <Clock className="w-3 h-3" />,
    className:
      'bg-[#FEF3C7] text-[#F59E0B] border border-[#FDE68A]',
  },
  PAID: {
    label: 'Đã thanh toán',
    icon: <CheckCircle2 className="w-3 h-3" />,
    className:
      'bg-[#D1FAE5] text-[#10B981] border border-[#A7F3D0]',
  },
  PARTIALLY_PAID: {
    label: 'Thanh toán 1 phần',
    icon: <CreditCard className="w-3 h-3" />,
    className:
      'bg-[#DBEAFE] text-[#1E3A8A] border border-[#BFDBFE]',
  },
  OVERDUE: {
    label: 'Quá hạn',
    icon: <AlertCircle className="w-3 h-3" />,
    className:
      'bg-[#FEE2E2] text-[#EF4444] border border-[#FECACA]',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: <Ban className="w-3 h-3" />,
    className:
      'bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB] line-through',
  },
};

export function InvoiceStatusBadge({ status, size = 'sm' }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const sizeClass = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] font-black uppercase tracking-widest ${sizeClass} ${config.className} transition-colors`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
