import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { contractsApi } from '../api/contracts';
import type { Contract } from '../types';

interface ExecuteRoomTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onSuccess?: () => void;
}

export function ExecuteRoomTransferModal({ isOpen, onClose, contract, onSuccess }: ExecuteRoomTransferModalProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingRooms, setFetchingRooms] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  const [targetRoomId, setTargetRoomId] = useState('');
  const [transferDate, setTransferDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rentPrice, setRentPrice] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [transferUnusedRent, setTransferUnusedRent] = useState(true);
  const [excessHandlingMethod, setExcessHandlingMethod] = useState<'CASH_REFUND' | 'KEEP_AS_CREDIT'>('KEEP_AS_CREDIT');

  useEffect(() => {
    if (isOpen) {
      setFetchingRooms(true);
      contractsApi.getAvailableRooms(contract.id)
        .then((res: any) => {
          setAvailableRooms(res.data || []);
        })
        .catch(() => toast.error('Lỗi khi tải danh sách phòng trống'))
        .finally(() => setFetchingRooms(false));
    } else {
      setTargetRoomId('');
      setTransferDate(format(new Date(), 'yyyy-MM-dd'));
      setRentPrice('');
      setDepositAmount('');
      setTransferUnusedRent(true);
    }
  }, [isOpen, contract.id]);

  useEffect(() => {
    if (targetRoomId) {
      const room = availableRooms.find(r => r.id === targetRoomId);
      if (room) {
        setRentPrice(room.base_price?.toString() || '');
        setDepositAmount(room.base_price?.toString() || '');
      }
    }
  }, [targetRoomId, availableRooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoomId) {
      toast.error('Vui lòng chọn phòng đích');
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        target_room_id: targetRoomId,
        transfer_date: transferDate,
        rent_price: rentPrice ? Number(rentPrice) : undefined,
        deposit_amount: depositAmount ? Number(depositAmount) : undefined,
        transfer_unused_rent: transferUnusedRent,
        excess_handling_method: excessHandlingMethod,
      };

      await contractsApi.executeRoomTransfer(contract.id, payload);
      toast.success('Chuyển phòng thành công! Hợp đồng mới đã được tạo.');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['contract', contract.id] });
      
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi chuyển phòng.');
    } finally {
      setIsLoading(false);
    }
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
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0 bg-blue-50/50 dark:bg-blue-900/20">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                Thực hiện chuyển phòng
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-500">
                  Hành động này sẽ thanh lý Hợp đồng phòng <span className="font-bold underline">{contract.room?.name}</span> và thiết lập Hợp đồng mới tại phòng được chọn.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Phòng Đích (cùng cơ sở) <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={fetchingRooms}
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:opacity-50"
                  required
                >
                  <option value="" disabled>
                    {fetchingRooms ? 'Đang tải danh sách...' : 'Chọn phòng trống...'}
                  </option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} {room.area ? `(${room.area}m2)` : ''} - {Number(room.base_price || 0).toLocaleString()}đ
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ngày chuyển điểm <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Giá thuê HĐ mới (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={rentPrice}
                    onChange={(e) => setRentPrice(e.target.value)}
                    placeholder="Để trống lấy giá mặc định"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Tiền cọc HĐ mới (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Để trống lấy giá mặc định"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="flex items-center gap-3 p-4 border border-blue-200 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={transferUnusedRent}
                    onChange={(e) => setTransferUnusedRent(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-600"
                  />
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white">Luân chuyển Tiền nhà dư & Cọc cũ</span>
                    <span className="block text-sm text-slate-500">
                      Tự động luân chuyển tiền cọc cũ và cộng cả tiền phòng chưa dùng hết tháng để bù trừ phí Hóa đơn mới.
                    </span>
                  </div>
                </label>
              </div>

              {transferUnusedRent && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Xử lý tiền thừa (nếu phòng mới rẻ hơn)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${excessHandlingMethod === 'KEEP_AS_CREDIT' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="excess_handling" 
                        value="KEEP_AS_CREDIT"
                        checked={excessHandlingMethod === 'KEEP_AS_CREDIT'}
                        onChange={() => setExcessHandlingMethod('KEEP_AS_CREDIT')}
                        className="mt-1"
                      />
                      <div>
                        <span className="block font-medium">Lưu vào Ví hợp đồng</span>
                        <span className="block text-xs text-slate-500">Hệ thống sẽ tự động trừ vào các hóa đơn điện nước tháng sau.</span>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${excessHandlingMethod === 'CASH_REFUND' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="excess_handling" 
                        value="CASH_REFUND"
                        checked={excessHandlingMethod === 'CASH_REFUND'}
                        onChange={() => setExcessHandlingMethod('CASH_REFUND')}
                        className="mt-1"
                      />
                      <div>
                        <span className="block font-medium">Trả tiền mặt</span>
                        <span className="block text-xs text-slate-500">Quản lý tự rút tiền đưa tay, hệ thống chốt số dư hóa đơn về 0.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

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
                  disabled={isLoading}
                  className="px-6 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xác nhận Chuyển phòng
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
