import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { useContractActions } from '../hooks/useContracts';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface TerminateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

export function TerminateContractModal({ isOpen, onClose, contract }: TerminateContractModalProps) {
  const { terminateContract } = useContractActions();
  const queryClient = useQueryClient();
  const [terminationDate, setTerminationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cancellationParty, setCancellationParty] = useState<'LANDLORD' | 'TENANT' | 'MUTUAL'>('TENANT');
  const [reason, setReason] = useState('');
  const [waivePenalty, setWaivePenalty] = useState(false);
  const [refundRemainingRent, setRefundRemainingRent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    terminateContract.mutate(
      {
        id: contract.id,
        data: {
          termination_date: terminationDate,
          cancellation_party: cancellationParty,
          cancellation_reason: reason,
          waive_penalty: waivePenalty,
          refund_remaining_rent: refundRemainingRent,
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã thanh lý hợp đồng thành công');
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thanh lý hợp đồng');
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Thanh lý hợp đồng
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ngày thanh lý
                </label>
                <input
                  type="date"
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Bên khởi xướng việc thanh lý
                </label>
                <select
                  value={cancellationParty}
                  onChange={(e) => setCancellationParty(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                  required
                >
                  <option value="TENANT">Khách thuê yêu cầu trả phòng (báo dời đi)</option>
                  <option value="LANDLORD">Chủ nhà yêu cầu lấy lại phòng</option>
                  <option value="MUTUAL">Thời hạn hợp đồng kết thúc / Thỏa thuận 2 bên</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Lý do chi tiết
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                  placeholder="Ví dụ: Khách muốn chuyển công tác, chủ lấy nhà sửa chữa..."
                  required
                />
              </div>

              <div className="space-y-4">
                {cancellationParty === 'TENANT' && (
                  <label className="flex items-center gap-3 p-4 border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={waivePenalty}
                      onChange={(e) => setWaivePenalty(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-600"
                    />
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-white">Miễn phạt cọc</span>
                      <span className="block text-sm text-slate-500">
                        {waivePenalty 
                          ? 'Sẽ hoàn trả tiền cọc cho khách.'
                          : 'Nếu không được đánh dấu, hệ thống sẽ tự động PHẠT (thu) tiền cọc do khách thuê dời đi trước hạn.'}
                      </span>
                    </div>
                  </label>
                )}

                <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={refundRemainingRent}
                    onChange={(e) => setRefundRemainingRent(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-600"
                  />
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white">Hoàn tiền thuê phòng còn lại</span>
                    <span className="block text-sm text-slate-500">Tính toán và hoàn lại số tiền phòng chưa sử dụng nếu đã thanh toán trước.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={terminateContract.isPending}
                  className="px-6 py-3 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                  {terminateContract.isPending && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Xác nhận Thanh lý
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
