import { useState } from 'react';
import { X, Loader2, Building2, Hash, Check, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFloorActions } from '../hooks/useFloors';
import { toast } from 'react-hot-toast';

interface FloorFormProps {
  propertyId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FloorForm({ propertyId, onClose, onSuccess }: FloorFormProps) {
  const { createFloor } = useFloorActions();
  const [formData, setFormData] = useState({
    name: '',
    floor_number: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Tên tầng không được để trống';
    if (formData.floor_number === undefined || formData.floor_number === null) {
      newErrors.floor_number = 'Số tầng là bắt buộc';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createFloor.mutate(
      {
        ...formData,
        property_id: propertyId,
      },
      {
        onSuccess: () => {
          toast.success('Thêm tầng thành công');
          onSuccess?.();
          onClose();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Thêm tầng thất bại';
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Dialog */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-800 rounded-5xl shadow-2xl dark:shadow-black/50 w-full max-w-lg overflow-hidden border border-transparent dark:border-white/10"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Thêm tầng mới</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Thiết lập thông tin tầng cho tài sản này.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          {/* Name & Floor Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Tên tầng</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border rounded-2xl outline-none transition-all font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    errors.name 
                      ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500 ring-4 ring-rose-500/5' 
                      : 'border-slate-100 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10'
                  }`}
                  placeholder="Ví dụ: Tầng 1"
                />
              </div>
              {errors.name && <p className="text-xs text-rose-500 dark:text-rose-400 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Số tầng</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  value={formData.floor_number}
                  onChange={(e) => setFormData({ ...formData, floor_number: parseInt(e.target.value) || 0 })}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border rounded-2xl outline-none transition-all font-medium text-slate-900 dark:text-slate-100 ${
                    errors.floor_number 
                      ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500 ring-4 ring-rose-500/5' 
                      : 'border-slate-100 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10'
                  }`}
                />
              </div>
              {errors.floor_number && <p className="text-xs text-rose-500 dark:text-rose-400 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.floor_number}</p>}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createFloor.isPending}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30 active:scale-95 disabled:opacity-50"
            >
              {createFloor.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Check className="w-6 h-6" />
                  Xác nhận
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
