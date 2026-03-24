import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useRoomTemplateActions } from '../hooks/useTemplates';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RoomTemplate, CreateRoomTemplatePayload } from '../types';

const templateSchema = z.object({
  name: z.string().min(1, 'Tên mẫu phòng là bắt buộc'),
  room_type: z.string().min(1, 'Loại phòng là bắt buộc'),
  base_price: z.number().min(0, 'Giá thuê không hợp lệ'),
  area: z.number().min(0, 'Diện tích không hợp lệ').optional().or(z.literal(0)),
  capacity: z.number().min(1, 'Sức chứa tối thiểu 1').optional().or(z.literal(0)),
  description: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface RoomTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  template: RoomTemplate | null;
}

const formatNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
};

const parseNumber = (value: string) => {
  const numericString = value.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : undefined;
};

export function RoomTemplateModal({ isOpen, onClose, propertyId, template }: RoomTemplateModalProps) {
  const { createTemplate, updateTemplate } = useRoomTemplateActions(propertyId);
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      room_type: 'apartment',
      base_price: 0,
      area: undefined,
      capacity: 1,
      description: '',
    },
  });

  useEffect(() => {
    if (template && isOpen) {
      reset({
        name: template.name,
        room_type: template.room_type || 'apartment',
        base_price: template.base_price,
        area: template.area ?? undefined,
        capacity: template.capacity ?? 1,
        description: template.description || '',
      });
    } else if (isOpen) {
      reset({
        name: '',
        room_type: 'apartment',
        base_price: 0,
        area: undefined,
        capacity: 1,
        description: '',
      });
    }
  }, [template, isOpen, reset]);

  const onSubmit = (data: TemplateFormData) => {
    const payload: CreateRoomTemplatePayload = {
      name: data.name,
      room_type: data.room_type,
      base_price: data.base_price,
      area: data.area || undefined,
      capacity: data.capacity || undefined,
      description: data.description || undefined,
    };

    if (template) {
      updateTemplate.mutate(
        { id: template.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Cập nhật mẫu phòng thành công');
            onClose();
          },
        }
      );
    } else {
      createTemplate.mutate(payload, {
        onSuccess: () => {
          toast.success('Tạo mẫu phòng thành công');
          onClose();
        },
      });
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {template ? 'Cập nhật mẫu phòng' : 'Tạo mẫu phòng mới'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Tên mẫu phòng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'
                  }`}
                  placeholder="Vd: Phòng Mẫu Standard"
                />
                {errors.name && <p className="mt-1 text-sm text-rose-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Loại phòng <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('room_type')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                >
                  <option value="apartment">Căn hộ dịch vụ</option>
                  <option value="studio">Studio</option>
                  <option value="dorm">Ký túc xá (Dorm)</option>
                  <option value="house">Nhà nguyên căn</option>
                </select>
                {errors.room_type && <p className="mt-1 text-sm text-rose-500">{errors.room_type.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Giá thuê cơ bản (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="base_price"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumber(value)}
                      onChange={(e) => onChange(parseNumber(e.target.value) || 0)}
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                        errors.base_price ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'
                      }`}
                      placeholder="Vd: 3,000,000"
                    />
                  )}
                />
                {errors.base_price && <p className="mt-1 text-sm text-rose-500">{errors.base_price.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Diện tích (m²)
                  </label>
                  <Controller
                    name="area"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                          errors.area ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'
                        }`}
                        placeholder="Vd: 25"
                      />
                    )}
                  />
                  {errors.area && <p className="mt-1 text-sm text-rose-500">{errors.area.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Số người tối đa
                  </label>
                  <Controller
                    name="capacity"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumber(value)}
                        onChange={(e) => onChange(parseNumber(e.target.value))}
                        className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                          errors.capacity ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'
                        }`}
                        placeholder="Vd: 3"
                      />
                    )}
                  />
                  {errors.capacity && <p className="mt-1 text-sm text-rose-500">{errors.capacity.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Mô tả
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  placeholder="Đặc điểm nổi bật..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 pb-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createTemplate.isPending || updateTemplate.isPending}
                  className="px-6 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                  {(createTemplate.isPending || updateTemplate.isPending) && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
