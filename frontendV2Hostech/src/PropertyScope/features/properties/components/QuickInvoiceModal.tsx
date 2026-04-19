import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, Calendar, Zap, Droplets, CheckCircle2, 
  Loader2, AlertCircle, FileText 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { roomsApi } from '@/PropertyScope/features/rooms/api/rooms';
import type { Room } from '@/PropertyScope/features/rooms/types';

interface QuickInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export const QuickInvoiceModal: React.FC<QuickInvoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  room 
}) => {
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [readings, setReadings] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && room.meters) {
      const initialReadings: Record<string, string> = {};
      room.meters.forEach(meter => {
        // Find latest reading or use base_reading
        const prevReading = meter.last_reading ?? meter.base_reading ?? 0;
        
        initialReadings[meter.id] = prevReading.toString();
      });
      setReadings(initialReadings);
      setPeriodStart(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
      setPeriodEnd(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    }
  }, [isOpen, room]);

  const activeContract = room.contracts?.find(
    c => String(c.status).toLowerCase() === 'active' || String(c.status).toLowerCase() === 'pending_termination'
  );

  const createInvoice = useMutation({
    mutationFn: async () => {
      const payloadReadings = Object.keys(readings).map(meterId => ({
        meter_id: meterId,
        value: Number(readings[meterId]),
      }));

      return roomsApi.createQuickInvoice(room.id, {
        period_start: periodStart,
        period_end: periodEnd,
        readings: payloadReadings,
      });
    },
    onSuccess: () => {
      toast.success('Đã tạo hóa đơn thành công!');
      queryClient.invalidateQueries({ queryKey: ['rooms', room.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract) {
      toast.error('Phòng không có hợp đồng hiệu lực. Không thể tạo hóa đơn.');
      return;
    }
    createInvoice.mutate();
  };

  const getMeterIcon = (type: string) => {
    if (type === 'ELECTRIC') return <Zap className="w-5 h-5 text-amber-500" />;
    if (type === 'WATER') return <Droplets className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                    Chốt Tiền Tháng
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Phòng {room.name} {activeContract ? `(Đang có khách thuê)` : `(Phòng trống)`}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {!activeContract ? (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-400">Không thể thực hiện</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                      Phòng hiện tại không có hợp đồng nào đang hiệu lực nên không thể xuất hóa đơn.
                    </p>
                  </div>
                </div>
              ) : (
                <form id="quick-invoice-form" onSubmit={handleSubmit} className="space-y-8">
                  {/* Period Selection */}
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      1. Chu kỳ TÍnh TIền
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Từ ngày</label>
                        <input
                          type="date"
                          required
                          value={periodStart}
                          onChange={(e) => setPeriodStart(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Đến ngày</label>
                        <input
                          type="date"
                          required
                          value={periodEnd}
                          onChange={(e) => setPeriodEnd(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meters Logic */}
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      2. Chốt Số Đồng Hồ
                    </h3>

                    {room.meters && room.meters.length > 0 ? (
                      <div className="space-y-4">
                        {room.meters.map(meter => {
                           const prevReading = meter.last_reading ?? meter.base_reading ?? 0;
                           const currentVal = readings[meter.id] !== undefined ? Number(readings[meter.id]) : prevReading;
                           const usage = currentVal > prevReading ? currentVal - prevReading : 0;

                           return (
                             <div key={meter.id} className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl">
                               <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                                      {getMeterIcon(meter.type)}
                                   </div>
                                   <div>
                                      <p className="font-bold text-slate-900 dark:text-white text-sm">{meter.name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đồng hồ: {meter.serial_number}</p>
                                   </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs uppercase font-bold text-slate-400">Sử dụng</p>
                                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                                      {usage} <span className="text-xs font-bold text-slate-500">Mới</span>
                                    </p>
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Chỉ số cũ</label>
                                    <input 
                                      type="number"
                                      disabled
                                      value={prevReading}
                                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-slate-500 font-bold"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Chỉ số MỚI (chốt)</label>
                                    <input 
                                      type="number"
                                      min={prevReading}
                                      step="0.01"
                                      required
                                      value={readings[meter.id] !== undefined ? readings[meter.id] : prevReading}
                                      onChange={(e) => setReadings({...readings, [meter.id]: e.target.value})}
                                      className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold tabular-nums"
                                    />
                                 </div>
                               </div>
                             </div>
                           );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">Phòng này không có đồng hồ nào cần chốt số.</p>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      <strong>Lưu ý quan trọng:</strong> Hệ thống sẽ tự động trừ các khoản người thuê đã đóng trước (Rent Token / Tiền thẻ tháng) để hiển thị tiền phòng là 0, chỉ thu phí dịch vụ. Các dịch vụ cố định tính theo người sẽ được nhân với số lượng thiết lập sắn tại tab "Dịch vụ phòng".
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                disabled={createInvoice.isPending}
              >
                Hủy bỏ
              </button>
              {activeContract && (
                <button
                  type="submit"
                  form="quick-invoice-form"
                  disabled={createInvoice.isPending}
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {createInvoice.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Tạo Hóa Đơn Cho Khách
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
