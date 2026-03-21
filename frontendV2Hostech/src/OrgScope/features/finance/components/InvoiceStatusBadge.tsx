import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: string;
}

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config: Record<string, { label: string; icon: any; classes: string }> = {
    paid: {
      label: 'Paid',
      icon: CheckCircle2,
      classes: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    unpaid: {
      label: 'Unpaid',
      icon: Clock,
      classes: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    overdue: {
      label: 'Overdue',
      icon: AlertCircle,
      classes: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    draft: {
      label: 'Draft',
      icon: Clock,
      classes: 'bg-slate-50 text-slate-500 border-slate-100',
    },
    issued: {
      label: 'Issued',
      icon: Clock,
      classes: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      classes: 'bg-slate-100 text-slate-400 border-slate-200',
    }
  };

  const current = config[status.toLowerCase()] || config.draft;
  const Icon = current.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${current.classes}`}>
      <Icon className="w-3 h-3" />
      {current.label}
    </div>
  );
}
