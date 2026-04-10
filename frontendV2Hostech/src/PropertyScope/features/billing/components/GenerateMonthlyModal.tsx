import { useState } from 'react';
import { X, Zap, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { useGenerateMonthly } from '../hooks/usePropertyInvoices';

interface GenerateMonthlyModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateMonthlyModal({
  propertyId,
  isOpen,
  onClose,
}: GenerateMonthlyModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [billingDate, setBillingDate] = useState(today);
  const [resultCount, setResultCount] = useState<number | null>(null);

  const generateMutation = useGenerateMonthly(propertyId);

  const handleSubmit = async () => {
    setResultCount(null);
    try {
      const result = await generateMutation.mutateAsync({ billing_date: billingDate });
      setResultCount(result.count);
    } catch {
      // error handled via mutation state
    }
  };

  const handleClose = () => {
    setResultCount(null);
    generateMutation.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[12px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Tạo hóa đơn hàng tháng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tự động tạo hóa đơn cho tất cả phòng có hợp đồng
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Result success */}
          {resultCount !== null ? (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {resultCount} hóa đơn
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  đã được tạo thành công cho ngày <strong>{billingDate}</strong>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm rounded-[8px] hover:bg-[#1E3A8A] dark:hover:bg-blue-500 dark:hover:text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Date picker */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Ngày thanh toán
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 ml-1">
                  Hóa đơn sẽ thuộc kỳ thanh toán của tháng chứa ngày này
                </p>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-[8px] border border-amber-100 dark:border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                  Chức năng này sẽ tạo hóa đơn DRAFT cho tất cả phòng đang có hợp đồng
                  hoạt động. Hóa đơn đã tồn tại trong kỳ này sẽ không bị tạo lại.
                </p>
              </div>

              {/* Error */}
              {generateMutation.isError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  Đã có lỗi xảy ra. Vui lòng thử lại.
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 rounded-[8px] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={generateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm rounded-[8px] transition-colors"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Tạo hóa đơn
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
