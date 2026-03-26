import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Hash, Plus, AlertCircle } from 'lucide-react';
import { useFloors } from '../../floors/hooks/useFloors';
import { useBulkCreateRooms } from '../hooks/useRooms';
import type { RoomTemplate } from '../../templates/types';
import { toast } from 'react-hot-toast';
import { formatNumber } from '@/lib/utils';

interface BulkRoomCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  template: RoomTemplate | null;
}

export function BulkRoomCreateModal({ isOpen, onClose, propertyId, template }: BulkRoomCreateModalProps) {
  const { data: floors = [] } = useFloors(propertyId);
  const { bulkCreateRooms, isPending } = useBulkCreateRooms(propertyId);
  
  const [formData, setFormData] = useState({
    floor_id: '',
    prefix: 'Phòng',
    start_number: 1,
    count: 5,
  });

  const [error, setError] = useState<string | null>(null);

  if (!template) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.floor_id) {
      setError('Vui lòng chọn tầng');
      return;
    }

    try {
      await bulkCreateRooms.mutateAsync({
        property_id: propertyId,
        template_id: template.id,
        floor_id: formData.floor_id,
        prefix: formData.prefix,
        count: formData.count,
        start_number: formData.start_number,
      });
      toast.success('Đã gửi yêu cầu tạo phòng hàng loạt');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phòng');
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
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Tạo nhanh phòng từ mẫu
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                  Đang sử dụng mẫu: <span className="font-bold underline">{template.name}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-indigo-600 dark:text-indigo-400">
                  <span>• Diện tích: {formatNumber(template.area)}m²</span>
                  <span>• Giá: {formatNumber(template.base_price)}đ</span>
                  <span>• Sức chứa: {formatNumber(template.capacity)} người</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Chọn tầng áp dụng
                  </label>
                  <select
                    value={formData.floor_id}
                    onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-hidden text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Chọn tầng --</option>
                    {floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        Tầng {floor.floor_number} - {floor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Tiền tố tên phòng
                    </label>
                    <input
                      type="text"
                      value={formData.prefix}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                      placeholder="VD: Phòng"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-hidden text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Số phòng cần tạo
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-hidden text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Bắt đầu từ số
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.start_number}
                    onChange={(e) => setFormData({ ...formData, start_number: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-hidden text-sm text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    Ví dụ: Tiền tố "P." và bắt đầu từ 101 sẽ tạo: P.101, P.102, ...
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Bắt đầu tạo'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
