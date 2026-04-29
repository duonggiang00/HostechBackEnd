import { useMemo, useState } from 'react';
import { AlertCircle, Zap, Droplets, Receipt, BadgeDollarSign, Loader2, Scale } from 'lucide-react';
import { LiquidationPreviewModal } from './LiquidationPreviewModal';
import { differenceInCalendarDays, startOfMonth, getDaysInMonth } from 'date-fns';
import type { SubmittedMeterReading } from './types';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';

interface Step3PreviewProps {
  contract: any;
  terminationDate: string;
  cancellationParty: string;
  waivePenalty: boolean;
  damageFeeTotal: number;
  approvedReadings: SubmittedMeterReading[];
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

function fmt(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function getMeterIcon(type: string) {
  if (type === 'ELECTRIC' || type.includes('ELECTRIC')) return <Zap className="w-3.5 h-3.5 text-amber-500" />;
  return <Droplets className="w-3.5 h-3.5 text-blue-500" />;
}

function getMeterLabel(type: string) {
  if (type === 'ELECTRIC' || type.includes('ELECTRIC')) return 'Tiền điện';
  if (type === 'WATER' || type.includes('WATER')) return 'Tiền nước';
  return type;
}

export function Step3Preview({
  contract,
  terminationDate,
  cancellationParty,
  waivePenalty,
  damageFeeTotal,
  approvedReadings,
  onBack,
  onConfirm,
  isSubmitting,
}: Step3PreviewProps) {
  const [ledgerOpen, setLedgerOpen] = useState(false);
  // Pro-rated rent calculation (client-side estimate)
  const proRatedInfo = useMemo(() => {
    const termDate = new Date(terminationDate);
    const monthStart = startOfMonth(termDate);
    // +1 because differenceInCalendarDays is exclusive of end date, we include both start and end
    const daysUsed = differenceInCalendarDays(termDate, monthStart) + 1;
    const daysInMonth = getDaysInMonth(termDate);
    const fullRent = parseFloat(contract?.rent_price ?? contract?.base_rent ?? 0);
    const proRated = Math.round(fullRent * (daysUsed / daysInMonth));
    return { daysUsed, daysInMonth, fullRent, proRated };
  }, [terminationDate, contract]);

  const depositAmount = parseFloat(contract?.deposit_amount ?? 0);
  const isEarlyTermination = contract?.end_date
    ? new Date(terminationDate) < new Date(contract.end_date)
    : false;
  const willForfeit = isEarlyTermination && cancellationParty === 'TENANT' && !waivePenalty;

  const items = useMemo(() => {
    const list: { label: string; amount: number; icon: React.ReactNode; note?: string }[] = [];

    list.push({
      label: `Tiền thuê (${proRatedInfo.daysUsed}/${proRatedInfo.daysInMonth} ngày)`,
      amount: proRatedInfo.proRated,
      icon: <Receipt className="w-3.5 h-3.5 text-slate-500" />,
      note: `Pro-rated từ ${proRatedInfo.fullRent.toLocaleString()} ₫/tháng`,
    });

    approvedReadings.forEach(r => {
      list.push({
        label: `${getMeterLabel(r.meterType)} — ${r.meterCode}`,
        amount: 0, // Không biết chính xác — backend sẽ tính
        icon: getMeterIcon(r.meterType),
        note: `${r.consumption.toLocaleString()} ${r.meterType} (số ${r.prevValue} → ${r.currValue}) — backend tính giá`,
      });
    });

    if (depositAmount > 0) {
      if (willForfeit) {
        list.push({
          label: 'Tiền cọc (thu phạt)',
          amount: depositAmount,
          icon: <BadgeDollarSign className="w-3.5 h-3.5 text-rose-500" />,
          note: 'Khách dời trước hạn',
        });
      } else {
        list.push({
          label: 'Hoàn trả cọc',
          amount: -depositAmount,
          icon: <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-500" />,
          note: 'Sẽ chuyển sang REFUND_PENDING',
        });
      }
    }

    return list;
  }, [proRatedInfo, approvedReadings, depositAmount, willForfeit]);

  const estimatedTotal = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary header */}
      <div className="p-4 rounded-[12px] border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold">Ngày thanh lý</span>
          <span className="font-black text-slate-900 dark:text-white">{terminationDate}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold">Bên khởi xướng</span>
          <span className="font-black text-slate-900 dark:text-white">
            {cancellationParty === 'TENANT' ? 'Khách thuê' : cancellationParty === 'LANDLORD' ? 'Chủ nhà' : 'Thỏa thuận'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold">Đã chốt số</span>
          <span className="font-black text-emerald-600 dark:text-emerald-400">
            {approvedReadings.length} đồng hồ ✓
          </span>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-[12px] border border-slate-100 dark:border-slate-700 overflow-hidden">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-start justify-between gap-3 px-4 py-3 ${
              i < items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/60' : ''
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {item.icon}
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.label}</p>
                {item.note && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{item.note}</p>
                )}
              </div>
            </div>
            <span className={`text-sm font-black flex-shrink-0 ${
              item.amount < 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : item.amount === 0
                ? 'text-slate-400'
                : 'text-slate-900 dark:text-white'
            }`}>
              {item.amount === 0 ? '— (backend tính)' : fmt(item.amount)}
            </span>
          </div>
        ))}

        {/* Total */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Tổng dự kiến
          </span>
          <span className={`text-base font-black ${estimatedTotal < 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
            {fmt(estimatedTotal)}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[10px]">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
          Số liệu trên là <strong>ước tính phía client</strong>. Hệ thống sẽ tính lại chính xác
          dựa trên tiêu thụ thực tế và biểu giá dịch vụ khi xác nhận.
          Dùng nút <strong>Xem trước quyết toán</strong> để lấy số liệu FIFO từ máy chủ trước khi chốt.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setLedgerOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[8px] border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-sm font-black hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
      >
        <Scale className="w-4 h-4" />
        Xem trước quyết toán (cọc / nợ)
      </button>

      <LiquidationPreviewModal
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        contractId={contract.id}
        terminationDate={terminationDate}
        cancellationParty={cancellationParty}
        waivePenalty={waivePenalty}
        damageFeeTotal={damageFeeTotal}
      />

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <PageBackButton
          onBack={onBack}
          disabled={isSubmitting}
          className="rounded-[8px] border border-slate-200 px-4 py-2.5 font-black disabled:opacity-40 dark:border-slate-700"
        />
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm rounded-[8px] transition-colors shadow-lg shadow-rose-200/50 dark:shadow-none"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Thanh lý'}
        </button>
      </div>
    </div>
  );
}
