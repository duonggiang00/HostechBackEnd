import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMarkRefundPaid } from '../hooks/useFinance';
import type { RefundReceiptRow } from '../types';

interface Props {
  refund: RefundReceiptRow;
  onClose: () => void;
  onSuccess?: (updated: RefundReceiptRow) => void;
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export function MarkRefundPaidModal({ refund, onClose, onSuccess }: Props) {
  const [payoutMethod, setPayoutMethod] = useState<'CASH' | 'TRANSFER'>('TRANSFER');
  const [payoutReference, setPayoutReference] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));

  const mutation = useMarkRefundPaid();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await mutation.mutateAsync({
        id: refund.id,
        payload: {
          payout_method: payoutMethod,
          payout_reference: payoutReference.trim() || undefined,
          paid_at: paidAt || undefined,
        },
      });
      toast.success('Đã ghi nhận và sinh biên lai PDF.');
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Không thể ghi nhận hoàn cọc. Vui lòng thử lại.';
      toast.error(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-refund-paid-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Đóng"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:rounded-xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 id="mark-refund-paid-title" className="text-base font-semibold text-slate-900 dark:text-white">
              Xác nhận đã hoàn cọc
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Số tiền: <strong className="text-slate-900 dark:text-white">{fmtVND(refund.amount)}</strong>
              {refund.room_name ? ` · Phòng ${refund.room_name}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Sau khi xác nhận: trạng thái cọc của hợp đồng chuyển sang <strong>Đã hoàn trả</strong> và biên lai PDF được sinh
              ngay; khách thuê có thể tải biên lai trên app của họ.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Hình thức chi</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'CASH', label: 'Tiền mặt' },
                  { id: 'TRANSFER', label: 'Chuyển khoản' },
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPayoutMethod(opt.id)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    payoutMethod === opt.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                  aria-pressed={payoutMethod === opt.id}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="payout-reference" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Số tham chiếu (tuỳ chọn)
            </label>
            <input
              id="payout-reference"
              type="text"
              maxLength={100}
              value={payoutReference}
              onChange={e => setPayoutReference(e.target.value)}
              placeholder={payoutMethod === 'TRANSFER' ? 'VD: VCB-001234, mã giao dịch ngân hàng…' : 'VD: phiếu chi #001'}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label htmlFor="paid-at" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Ngày chi
            </label>
            <input
              id="paid-at"
              type="date"
              value={paidAt}
              onChange={e => setPaidAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-900"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Xác nhận đã chi
          </button>
        </footer>
      </form>
    </div>
  );
}
