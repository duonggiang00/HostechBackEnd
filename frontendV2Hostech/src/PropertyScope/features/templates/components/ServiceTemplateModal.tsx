import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useServiceTemplateActions } from '../hooks/useTemplates';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ServiceTemplate } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên dịch vụ'),
  type: z.string().min(1, 'Vui lòng chọn loại dịch vụ'),
  unit_price: z.number().min(0, 'Đơn giá không được âm'),
  unit: z.string().min(1, 'Vui lòng nhập đơn vị tính'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ServiceTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  template: ServiceTemplate | null;
}

export function ServiceTemplateModal({ isOpen, onClose, propertyId, template }: ServiceTemplateModalProps) {
  const { createTemplate, updateTemplate } = useServiceTemplateActions(propertyId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'ELECTRICITY',
      unit_price: 0,
      unit: 'kWh',
      description: '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        type: template.type,
        unit_price: template.unit_price,
        unit: template.unit,
        description: template.description || '',
      });
    } else {
      reset({
        name: '',
        type: 'ELECTRICITY',
        unit_price: 0,
        unit: 'kWh',
        description: '',
      });
    }
  }, [template, isOpen, reset]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    let newUnit = watch('unit');
    if (val === 'ELECTRICITY') newUnit = 'kWh';
    else if (val === 'WATER') newUnit = 'Khối';
    else if (val === 'INTERNET') newUnit = 'Tháng/Phòng';
    else if (val === 'TRASH') newUnit = 'Người/Tháng';

    setValue('type', val);
    setValue('unit', newUnit);
  };

  const onSubmit = (data: FormData) => {
    if (template) {
      updateTemplate.mutate(
        { id: template.id, data },
        {
          onSuccess: () => {
            toast.success('Cập nhật mẫu dịch vụ thành công');
            onClose();
          },
        }
      );
    } else {
      createTemplate.mutate(data, {
        onSuccess: () => {
          toast.success('Tạo mẫu dịch vụ thành công');
          onClose();
        },
      });
    }
  };

  const isSubmitting = createTemplate.isPending || updateTemplate.isPending;

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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {template ? 'Cập nhật mẫu dịch vụ' : 'Tạo mẫu dịch vụ mới'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              <form id="service-template-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Tên dịch vụ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    placeholder="Vd: Điện sinh hoạt"
                  />
                  {errors.name && <p className="mt-1 text-sm text-rose-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Loại dịch vụ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedType}
                    onChange={handleTypeChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    <option value="ELECTRICITY">Điện</option>
                    <option value="WATER">Nước</option>
                    <option value="INTERNET">Internet</option>
                    <option value="TRASH">Rác sinh hoạt</option>
                    <option value="MANAGEMENT">Phí quản lý</option>
                    <option value="PARKING">Gửi xe</option>
                    <option value="OTHER">Khác</option>
                  </select>
                  {errors.type && <p className="mt-1 text-sm text-rose-500">{errors.type.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Đơn giá (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('unit_price', { valueAsNumber: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      placeholder="Vd: 3500"
                    />
                    {errors.unit_price && <p className="mt-1 text-sm text-rose-500">{errors.unit_price.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Đơn vị tính <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('unit')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      placeholder="Vd: kWh"
                    />
                    {errors.unit && <p className="mt-1 text-sm text-rose-500">{errors.unit.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    placeholder="Thông tin thêm về dịch vụ..."
                  />
                  {errors.description && <p className="mt-1 text-sm text-rose-500">{errors.description.message}</p>}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="service-template-form"
                disabled={isSubmitting}
                className="px-6 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Lưu thay đổi
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

