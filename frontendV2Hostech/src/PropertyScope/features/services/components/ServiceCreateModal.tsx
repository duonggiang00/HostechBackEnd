import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import ServiceForm from './ServiceForm';
import { useCreateService } from '../hooks/useServices';
import { toast } from 'react-hot-toast';
import type { ServiceFormData } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceCreateModal({ isOpen, onClose }: Props) {
  const createMutation = useCreateService();

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Dịch vụ đã được tạo thành công');
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra khi tạo dịch vụ');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none p-4"
          >
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-xl font-bold text-[#111827] dark:text-white">Thêm dịch vụ mới</h2>
                  <p className="text-xs text-[#4B5563] dark:text-slate-400 mt-0.5">Định nghĩa cấu hình dịch vụ và bảng giá mới</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                <ServiceForm onSubmit={handleSubmit} />
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[#4B5563] hover:text-[#111827] dark:text-slate-300 dark:hover:text-white transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  form="service-form"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] shadow-sm transition-all focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 disabled:opacity-50 font-semibold"
                >
                  <Save className="w-4 h-4" />
                  {createMutation.isPending ? 'Đang lưu...' : 'Lưu dịch vụ'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
