import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { Payment } from '../types';
import { useVoidPayment } from '../hooks/useFinance';
import toast from 'react-hot-toast';

interface VoidPaymentModalProps {
  payment: Payment | null;
  onClose: () => void;
}

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

const methodLabel: Record<string, string> = {
  CASH:          'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  TRANSFER:      'Chuyển khoản',
  WALLET:        'Ví điện tử',
  QR:            'QR Code',
};

export function VoidPaymentModal({ payment, onClose }: VoidPaymentModalProps) {
  const { mutate: voidPayment, isPending } = useVoidPayment();

  if (!payment) return null;

  const handleConfirm = () => {
    voidPayment(payment.id, {
      onSuccess: () => {
        toast.success('Đã hủy biên lai thành công. Sổ cái đã được hoàn tác.');
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Lỗi khi hủy biên lai');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-rose-50/50 dark:bg-rose-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Hủy Biên lai</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Thao tác này không thể hoàn tác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Thông tin biên lai */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Mã biên lai</span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                #{payment.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Số tiền</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                {fmtVND(payment.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Phương thức</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {methodLabel[payment.method] ?? payment.method}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Ngày nhận</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {fmtDate(payment.received_at)}
              </span>
            </div>
            {payment.payer && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Khách trả</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {payment.payer.full_name}
                </span>
              </div>
            )}
          </div>

          {/* Cảnh báo hệ quả */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              ⚠️ Sau khi hủy, hệ thống sẽ tự động:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-600 dark:text-amber-500 list-disc list-inside">
              <li>Hoàn tác gạch nợ ({payment.allocations.length} hóa đơn liên quan)</li>
              <li>Ghi bút toán đảo ngược vào sổ cái</li>
              <li>Cập nhật lại trạng thái các hóa đơn</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Không, giữ lại
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 active:bg-rose-800 flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}
