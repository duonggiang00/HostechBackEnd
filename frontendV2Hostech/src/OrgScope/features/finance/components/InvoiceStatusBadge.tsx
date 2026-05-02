import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: string;
}

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config: Record<string, { label: string; icon: any; classes: string }> = {
    paid: {
      label: 'Đã thanh toán',
      icon: CheckCircle2,
      classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    unpaid: {
      label: 'Chưa thanh toán',
      icon: Clock,
      classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    overdue: {
      label: 'Quá hạn',
      icon: AlertCircle,
      classes: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    draft: {
      label: 'Bản nháp',
      icon: Clock,
      classes: 'bg-white/10 text-slate-400 border-white/15',
    },
    issued: {
      label: 'Đã phát hành',
      icon: Clock,
      classes: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    },
    cancelled: {
      label: 'Đã hủy',
      icon: XCircle,
      classes: 'bg-white/10 text-slate-500 border-white/15',
    },
  };

  const current = config[status.toLowerCase()] || config.draft;
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${current.classes}`}
    >
      <Icon className="h-3 w-3" />
      {current.label}
    </div>
  );
}
