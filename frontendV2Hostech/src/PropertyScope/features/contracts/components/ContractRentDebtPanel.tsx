import { Link } from 'react-router-dom';
import { parseISO, isValid } from 'date-fns';
import { CheckCircle2, CircleDollarSign, Loader2, AlertTriangle } from 'lucide-react';
import type { ContractInvoiceDebt } from '../types';

const formatVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

/** DD/MM/YY */
const fmtShort = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    const d = parseISO(iso.length > 10 ? iso.slice(0, 10) : iso);
    if (!isValid(d)) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  } catch {
    return '—';
  }
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  ISSUED: 'Chưa thanh toán',
  OVERDUE: 'Trễ thanh toán',
  PARTIAL: 'Thanh toán một phần',
  PENDING: 'Chờ xử lý',
  LATE: 'Trễ thanh toán',
  DRAFT: 'Nháp',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã huỷ',
};

interface ContractRentDebtPanelProps {
  propertyId: string;
  invoiceDebt: ContractInvoiceDebt | null | undefined;
  isLoading: boolean;
}

export function ContractRentDebtPanel({ propertyId, invoiceDebt, isLoading }: ContractRentDebtPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!invoiceDebt) {
    return (
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Chưa có dữ liệu hoá đơn cho hợp đồng này.
      </p>
    );
  }

  if (!invoiceDebt.has_debt) {
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-500/10 px-4 py-4 flex gap-3 items-start">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Không có hóa đơn nợ</p>
          <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80 mt-1">
            Mọi hóa đơn liên quan đã được thanh toán đủ hoặc chưa phát sinh nợ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-rose-200/90 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 px-4 py-3.5">
        <div className="flex gap-3 items-start">
          <CircleDollarSign className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                Tổng còn nợ
              </p>
              <p className="text-[15px] sm:text-base font-black tabular-nums text-rose-900 dark:text-rose-100 leading-snug mt-1 break-words">
                {formatVnd(invoiceDebt.total_outstanding)}
              </p>
            </div>
            {invoiceDebt.overdue_count > 0 && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 dark:text-rose-200 bg-white/80 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-rose-200/70 dark:border-rose-500/25 w-fit max-w-full">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="leading-tight">
                  {invoiceDebt.overdue_count} hoá đơn
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ul className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
        {invoiceDebt.invoices.map((inv) => (
          <li key={inv.id}>
            <Link
              to={`/properties/${propertyId}/billing/invoices/${inv.id}`}
              className={`block rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40 ${
                inv.is_overdue
                  ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-500/5'
                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50'
              }`}
            >
              <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 leading-snug">
                Hóa đơn kỳ: {fmtShort(inv.period_start)} - {fmtShort(inv.period_end)}
              </p>
              <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                Hạn: {fmtShort(inv.due_date)}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-rose-700 dark:text-rose-300 tabular-nums">
                  {formatVnd(inv.debt)}
                </span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {INVOICE_STATUS_LABEL[inv.status] ?? inv.status}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
