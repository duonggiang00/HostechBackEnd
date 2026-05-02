import { ArrowRight, CreditCard, Loader2, Upload } from 'lucide-react';

export type TenantInvoicePaymentActionsVariant = 'card' | 'drawer';

export interface TenantInvoicePaymentActionsProps {
  variant?: TenantInvoicePaymentActionsVariant;
  /** Với variant `card`: hiển thị 2 nút cạnh nhau từ `sm` trở lên (khối “Thanh toán đầu kỳ” rộng hơn). */
  cardSplitRow?: boolean;
  showSectionTitle?: boolean;
  sectionTitle?: string;
  vnpayLabel?: string;
  vnpayPendingLabel?: string;
  manualLabel?: string;
  isVnpayPending: boolean;
  onVnpay: () => void;
  onManualProof: () => void;
  vnpayDisabled?: boolean;
  manualDisabled?: boolean;
  className?: string;
}

/**
 * Hai nút thanh toán (VNPay + chứng từ tiền mặt/CK) dùng chung cho màn hợp đồng tenant và modal hóa đơn.
 */
export function TenantInvoicePaymentActions({
  variant = 'card',
  cardSplitRow = false,
  showSectionTitle = true,
  sectionTitle = 'Chọn hình thức thanh toán',
  vnpayLabel = 'Thanh toán VNPay',
  vnpayPendingLabel = 'Đang chuyển sang VNPay',
  manualLabel = 'Trả tiền mặt / chuyển khoản',
  isVnpayPending,
  onVnpay,
  onManualProof,
  vnpayDisabled = false,
  manualDisabled = false,
  className = '',
}: TenantInvoicePaymentActionsProps) {
  const isDrawer = variant === 'drawer';

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {showSectionTitle && (
        <p
          className={
            isDrawer
              ? 'text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400'
              : 'text-center text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400'
          }
        >
          {sectionTitle}
        </p>
      )}

      {isDrawer ? (
        <>
          <button
            type="button"
            onClick={onVnpay}
            disabled={isVnpayPending || vnpayDisabled}
            className="group flex w-full items-center justify-between rounded-2xl bg-slate-950 px-6 py-4 font-black text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <span className="flex items-center gap-3">
              {isVnpayPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5 opacity-70 transition-opacity group-hover:opacity-100" />
              )}
              {isVnpayPending ? vnpayPendingLabel : vnpayLabel}
            </span>
            {!isVnpayPending && <ArrowRight className="h-5 w-5 opacity-70 transition-all group-hover:translate-x-1 group-hover:opacity-100" />}
          </button>
          <button
            type="button"
            onClick={onManualProof}
            disabled={manualDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400"
          >
            <Upload className="h-4 w-4" />
            {manualLabel}
          </button>
        </>
      ) : (
        <div className={cardSplitRow ? 'flex flex-col gap-2 sm:flex-row' : 'flex flex-col gap-2'}>
          <button
            type="button"
            onClick={onVnpay}
            disabled={isVnpayPending || vnpayDisabled}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 ${cardSplitRow ? 'w-full flex-1 sm:py-3' : 'w-full py-3.5'}`}
          >
            {isVnpayPending ? <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" /> : <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />}
            {isVnpayPending ? vnpayPendingLabel : vnpayLabel}
          </button>
          <button
            type="button"
            onClick={onManualProof}
            disabled={manualDisabled}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300 ${cardSplitRow ? 'w-full flex-1' : 'w-full py-3.5'}`}
          >
            <Upload className="h-4 w-4" />
            {manualLabel}
          </button>
        </div>
      )}
    </div>
  );
}
