import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, DollarSign, Calendar, CreditCard, Hash, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePayInvoice } from '../hooks/useBilling';
import type { Invoice } from '@/PropertyScope/features/rooms/types';

const paySchema = z.object({
  payment_method: z.string().min(1, 'Vui lòng chọn phương thức thanh toán'),
  payment_date: z.string().min(1, 'Vui lòng chọn ngày thanh toán'),
  amount: z.coerce.number().min(1, 'Số tiền phải lớn hơn 0'),
  reference_number: z.string().optional(),
});

type PayFormValues = z.infer<typeof paySchema>;

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export function RecordPaymentModal({ isOpen, onClose, invoice }: RecordPaymentModalProps) {
  const { mutateAsync: payInvoice } = usePayInvoice();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingAmount = invoice.total_amount - invoice.paid_amount;

  const { register, handleSubmit, formState: { errors } } = useForm<PayFormValues>({
    resolver: zodResolver(paySchema),
    defaultValues: {
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      amount: remainingAmount,
      reference_number: '',
    },
  });

  const onSubmit = async (data: PayFormValues) => {
    try {
      setIsSubmitting(true);
      await payInvoice({ invoiceId: invoice.id, payload: data });
      toast.success('Đã ghi nhận thanh toán thành công!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi ghi nhận thanh toán');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Thanh toán hóa đơn</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Hóa đơn ngày {new Date(invoice.issue_date).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4 mb-6 border border-indigo-100 dark:border-indigo-500/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Tổng còn thiếu</span>
              <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">
                {remainingAmount.toLocaleString('vi-VN')}₫
              </span>
            </div>
          </div>

          <form id="record-payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  Số tiền thanh toán (VNĐ)
                </label>
                <button 
                  type="button"
                  onClick={() => register('amount').onChange({ target: { value: remainingAmount } })}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  Tối đa
                </button>
              </div>
              <input
                type="number"
                {...register('amount', {
                  max: { value: remainingAmount, message: `Số tiền không được lớn hơn ${remainingAmount.toLocaleString('vi-VN')}₫` }
                })}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all ${
                  errors.amount ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                }`}
              />
              {errors.amount && <p className="text-rose-500 text-xs font-medium">{errors.amount.message}</p>}
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                Phương thức
              </label>
              <select
                {...register('payment_method')}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all ${
                  errors.payment_method ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                }`}
              >
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="credit_card">Thẻ tín dụng</option>
              </select>
              {errors.payment_method && <p className="text-rose-500 text-xs font-medium">{errors.payment_method.message}</p>}
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Ngày thanh toán
              </label>
              <input
                type="date"
                {...register('payment_date')}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all ${
                  errors.payment_date ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                }`}
              />
              {errors.payment_date && <p className="text-rose-500 text-xs font-medium">{errors.payment_date.message}</p>}
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                Mã giao dịch (Không bắt buộc)
              </label>
              <input
                type="text"
                placeholder="VD: FT211..."
                {...register('reference_number')}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="record-payment-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Xác nhận thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
