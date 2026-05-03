import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  User,
  FileText,
  Settings,
  AlertTriangle,
  ClipboardCheck,
  PenLine,
  Receipt,
  Coins,
  Wallet,
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react';
import type {
  ContractStatusEventType,
  ContractStatusHistory,
} from '../types';
import { contractStatusLabelVi } from '../utils/contractStatusLabels';

interface ContractStatusTimelineProps {
  histories: ContractStatusHistory[];
  isLoading: boolean;
  /**
   * Bản rút gọn dành cho tenant: ẩn người thực hiện, không hiển thị id nội bộ.
   */
  compact?: boolean;
}

interface VisualConfig {
  icon: typeof CheckCircle2;
  label: string;
  toneClass: string; // class màu icon + nền vòng tròn
  badgeClass?: string;
}

const TRANSITION_ICONS: Record<string, typeof CheckCircle2> = {
  'DRAFT->PENDING_SIGNATURE': FileText,
  'PENDING_SIGNATURE->PENDING_PAYMENT': Clock,
  'PENDING_PAYMENT->ACTIVE': CheckCircle2,
  'ACTIVE->PENDING_TERMINATION': AlertTriangle,
  'ACTIVE->TERMINATED': CheckCircle2,
  'ACTIVE->CANCELLED': AlertTriangle,
  'ACTIVE->EXPIRED': Clock,
  'ACTIVE->ENDED': CheckCircle2,
  'PENDING_TERMINATION->PENDING_SETTLEMENT': Clock,
  'PENDING_TERMINATION->TERMINATED': CheckCircle2,
  'PENDING_TERMINATION->CANCELLED': AlertTriangle,
  'PENDING_SETTLEMENT->TERMINATED': CheckCircle2,
  'EXPIRED->TERMINATED': CheckCircle2,
};

function visualFor(history: ContractStatusHistory): VisualConfig {
  const ev = history.event_type as ContractStatusEventType;

  if (ev === 'CONTRACT_CREATED') {
    return {
      icon: Sparkles,
      label: 'Khởi tạo hợp đồng',
      toneClass: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300',
      badgeClass: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300',
    };
  }
  if (ev === 'SIGNATURE_TENANT') {
    return {
      icon: PenLine,
      label: 'Khách thuê ký',
      toneClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
    };
  }
  if (ev === 'SIGNATURE_MANAGER') {
    return {
      icon: PenLine,
      label: 'Quản lý ký',
      toneClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
    };
  }
  if (ev === 'HANDOVER_SUBMITTED') {
    return {
      icon: ClipboardCheck,
      label: 'Bàn giao trả phòng',
      toneClass: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300',
      badgeClass: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300',
    };
  }
  if (ev === 'FINAL_INVOICE_GENERATED') {
    return {
      icon: Receipt,
      label: 'Phát hành hóa đơn thanh lý',
      toneClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300',
      badgeClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300',
    };
  }
  if (ev === 'DEBT_RECONCILIATION') {
    return {
      icon: Coins,
      label: 'Cấn trừ cọc',
      toneClass: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300',
      badgeClass: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300',
    };
  }
  if (ev === 'SETTLEMENT_PAYMENT_REQUESTED') {
    return {
      icon: Wallet,
      label: 'Yêu cầu thanh toán nốt',
      toneClass: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300',
      badgeClass: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300',
    };
  }
  if (ev === 'SETTLEMENT_RESOLVED') {
    return {
      icon: CheckCircle2,
      label: 'Quyết toán hoàn tất',
      toneClass: 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300',
      badgeClass: 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300',
    };
  }
  if (ev === 'ROOM_TRANSFER') {
    return {
      icon: ArrowLeftRight,
      label: 'Chuyển phòng',
      toneClass: 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300',
      badgeClass: 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300',
    };
  }

  // STATUS_CHANGE — chọn icon theo cặp from->to
  const transitionKey = `${history.from_status ?? 'DRAFT'}->${history.to_status ?? ''}`;
  const Icon = TRANSITION_ICONS[transitionKey] ?? Settings;
  return {
    icon: Icon,
    label: 'Đổi trạng thái',
    toneClass: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  };
}

function payloadHints(history: ContractStatusHistory): string[] {
  const p = history.payload ?? {};
  const out: string[] = [];
  if (p.invoice_id) out.push(`Hóa đơn: ${String(p.invoice_id).slice(0, 8)}…`);
  if (p.handover_id) out.push(`Biên bản: ${String(p.handover_id).slice(0, 8)}…`);
  if (p.refund_receipt_id) out.push(`Phiếu hoàn cọc: ${String(p.refund_receipt_id).slice(0, 8)}…`);
  if (p.final_payment_request_id) out.push(`Yêu cầu thu nốt: ${String(p.final_payment_request_id).slice(0, 8)}…`);
  if (p.amount_due) out.push(`Số tiền: ${Number(p.amount_due).toLocaleString('vi-VN')} đ`);
  if (p.total_amount) out.push(`Tổng: ${Number(p.total_amount).toLocaleString('vi-VN')} đ`);
  if (p.billing_mode) out.push(`Hình thức: ${p.billing_mode}`);
  return out;
}

export function ContractStatusTimeline({ histories, isLoading, compact = false }: ContractStatusTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!histories || histories.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 ">
        Chưa có sự kiện nào cho hợp đồng này.
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 dark:before:via-indigo-800/50 before:to-transparent">
      {histories.map((history, idx) => {
        const visual = visualFor(history);
        const Icon = visual.icon;
        const hints = payloadHints(history);
        const showStatusBadge = history.event_type === 'STATUS_CHANGE' && !!history.to_status;

        return (
          <motion.div
            key={history.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative flex items-start gap-5 group is-active"
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 shrink-0 shadow-md z-10 ${visual.toneClass}`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="w-[calc(100%-3.5rem)] p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <div className="font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase ${visual.badgeClass ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}
                  >
                    {visual.label}
                  </span>
                  {showStatusBadge && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wide bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      {history.from_status ? `${contractStatusLabelVi(history.from_status)} → ` : ''}
                      {contractStatusLabelVi(history.to_status)}
                    </span>
                  )}
                </div>
                <time className="text-xs font-semibold text-slate-400 shrink-0">
                  {format(new Date(history.created_at), 'dd/MM/yyyy HH:mm')}
                </time>
              </div>

              {history.notes && (
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-2 break-words whitespace-pre-wrap">
                  {history.notes}
                </div>
              )}

              {hints.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hints.map((h) => (
                    <span
                      key={h}
                      className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[11px] font-semibold dark:bg-slate-900/60 dark:text-slate-400"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {!compact && history.changed_by_user && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    Bởi: <strong>{history.changed_by_user.full_name || history.changed_by_user.email}</strong>
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
