import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { usePropertyReadings } from '../../metering/hooks/useMeters';
import { usePropertyInvoices } from '../hooks/usePropertyInvoices';

interface Props {
  propertyId: string;
  onOpenBulkApprove?: () => void;
  onOpenGenerateModal?: () => void;
}

interface StepProps {
  step: number;
  title: string;
  description: string;
  status: 'done' | 'action' | 'locked' | 'warning';
  badge?: string | number;
  onAction?: () => void;
  actionLabel?: string;
}

function Step({ step, title, description, status, badge, onAction, actionLabel }: StepProps) {
  const colors = {
    done:    { icon: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    action:  { icon: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
    warning: { icon: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/30', text: 'text-rose-600 dark:text-rose-400' },
    locked:  { icon: 'bg-slate-100 dark:bg-slate-800 text-slate-400', border: 'border-slate-100 dark:border-slate-800', text: 'text-slate-400' },
  };
  const c = colors[status];

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${c.border} bg-white dark:bg-slate-900 transition-all`}>
      {/* Step circle */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${c.icon}`}>
        {status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : status === 'warning' ? <AlertCircle className="w-5 h-5" /> : <span>{step}</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-slate-800 dark:text-slate-200">{title}</span>
          {badge !== undefined && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              status === 'done' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : status === 'action' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>

      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${
            status === 'done'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              : status === 'action'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : status === 'warning'
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {actionLabel}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function BillingPeriodChecklist({ propertyId, onOpenBulkApprove, onOpenGenerateModal }: Props) {
  const thisMonth = format(new Date(), 'MM/yyyy');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd   = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  // Pending readings
  const { data: pendingData } = usePropertyReadings(propertyId, { status: 'PENDING', period_start: monthStart, period_end: monthEnd });
  const { data: approvedData } = usePropertyReadings(propertyId, { status: 'APPROVED', period_start: monthStart, period_end: monthEnd });

  // Draft invoices
  const { data: draftData } = usePropertyInvoices(propertyId, { status: 'DRAFT', per_page: 1 });
  const { data: issuedData } = usePropertyInvoices(propertyId, { status: 'ISSUED', per_page: 1 });

  const pendingCount  = pendingData?.meta?.total ?? pendingData?.data?.length ?? 0;
  const approvedCount = approvedData?.meta?.total ?? approvedData?.data?.length ?? 0;
  const draftCount    = draftData?.meta?.total ?? 0;
  const issuedCount   = issuedData?.meta?.total ?? 0;

  const hasReadings    = approvedCount > 0 || pendingCount > 0;
  const allApproved    = hasReadings && pendingCount === 0;
  const hasInvoices    = draftCount > 0 || issuedCount > 0;
  const allIssued      = hasInvoices && draftCount === 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tiến độ kỳ tháng {thisMonth}</span>
      </div>

      <div className="space-y-2.5">
        {/* Step 1: Chốt số */}
        <Step
          step={1}
          title="Chốt số điện / nước"
          description={
            !hasReadings
              ? 'Chưa có chỉ số nào trong tháng này'
              : `${approvedCount + pendingCount} chốt số — ${pendingCount > 0 ? `${pendingCount} chờ duyệt` : 'tất cả đã duyệt'}`
          }
          status={!hasReadings ? 'action' : pendingCount > 0 ? 'action' : 'done'}
          badge={pendingCount > 0 ? `${pendingCount} chờ duyệt` : approvedCount > 0 ? `${approvedCount} đã duyệt` : undefined}
          onAction={onOpenBulkApprove}
          actionLabel={pendingCount > 0 ? 'Duyệt ngay' : 'Xem lại'}
        />

        {/* Step 2: Duyệt số */}
        <Step
          step={2}
          title="Duyệt chốt số"
          description={
            !hasReadings
              ? 'Chưa có chỉ số để duyệt'
              : allApproved
              ? `Đã duyệt đủ ${approvedCount} chốt số`
              : `Còn ${pendingCount} chốt số chưa duyệt`
          }
          status={!hasReadings ? 'locked' : allApproved ? 'done' : 'warning'}
          badge={pendingCount > 0 ? `${pendingCount} pending` : undefined}
          onAction={pendingCount > 0 ? onOpenBulkApprove : undefined}
          actionLabel={pendingCount > 0 ? 'Duyệt hàng loạt' : undefined}
        />

        {/* Step 3: Tạo hóa đơn */}
        <Step
          step={3}
          title="Tạo hóa đơn tháng"
          description={
            !allApproved
              ? 'Hoàn thành duyệt số trước khi tạo hóa đơn'
              : !hasInvoices
              ? 'Chưa có hóa đơn nào — bấm để tạo hết cho tháng này'
              : `${draftCount} DRAFT · ${issuedCount} đã phát hành`
          }
          status={!allApproved ? 'locked' : !hasInvoices ? 'action' : 'done'}
          onAction={allApproved ? onOpenGenerateModal : undefined}
          actionLabel={!hasInvoices ? 'Tạo ngay' : 'Tạo thêm'}
        />

        {/* Step 4: Phát hành */}
        <Step
          step={4}
          title="Phát hành & Thu tiền"
          description={
            !hasInvoices
              ? 'Chưa có hóa đơn để phát hành'
              : allIssued
              ? `Đã phát hành hết ${issuedCount} hóa đơn`
              : `${draftCount} hóa đơn DRAFT chưa được phát hành`
          }
          status={!hasInvoices ? 'locked' : allIssued ? 'done' : draftCount > 0 ? 'action' : 'done'}
          badge={draftCount > 0 ? `${draftCount} DRAFT` : undefined}
        />
      </div>
    </div>
  );
}
