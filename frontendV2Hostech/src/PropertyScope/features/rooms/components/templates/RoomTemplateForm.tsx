import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Maximize2, Users, Coins, Zap, Gauge, 
  Trash2, Plus, Check, Box, ArrowRight, ArrowLeft, Loader2
} from 'lucide-react';
import { ActionButton } from '@/shared/components/ui/ActionButton';
import { formatNumber, parseNumber } from '@/lib/utils';
import type { RoomTemplate } from '../../types';

// Zod Schema
export const roomTemplateSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên biểu mẫu'),
  room_type: z.enum(['standard', 'studio', 'duplex', 'penthouse']),
  area: z.number().min(0.1, 'Diện tích phải lớn hơn 0'),
  capacity: z.number().min(1, 'Sức chứa tối thiểu 1 người'),
  base_price: z.number().min(0, 'Giá thuê không được âm'),
  assets: z.array(z.object({
    name: z.string().min(1, 'Tên nội thất không được đóng')
  })),
  meters: z.array(z.object({
    type: z.enum(['ELECTRIC', 'WATER', 'OTHER'])
  })),
});

export type RoomTemplateFormData = z.infer<typeof roomTemplateSchema>;

interface RoomTemplateFormProps {
  initialData?: RoomTemplate | null;
  propertyArea?: number | null;
  onSave: (data: RoomTemplateFormData) => void;
  isSaving: boolean;
}

const ROOM_TYPES = [
  { value: 'standard', label: 'Tiêu chuẩn (Standard)' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Căn hộ Duplex' },
  { value: 'penthouse', label: 'Penthouse' },
] as const;

export function RoomTemplateForm({ initialData, propertyArea, onSave, isSaving }: RoomTemplateFormProps) {
  const [step, setStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors }
  } = useForm<RoomTemplateFormData>({
    resolver: zodResolver(roomTemplateSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      room_type: (initialData?.room_type as any) ?? 'standard',
      area: initialData?.area ?? 25,
      capacity: initialData?.capacity ?? 2,
      base_price: initialData?.base_price ?? 0,
      assets: initialData?.assets?.length 
        ? initialData.assets.map(a => ({ name: a.name })) 
        : [],
      meters: initialData?.meters?.length && initialData.meters.length > 0
        ? initialData.meters.map(m => ({ type: m.type as any }))
        : [{ type: 'ELECTRIC' }, { type: 'WATER' }]
    }
  });

  const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({
    control,
    name: 'assets'
  });

  const { fields: meterFields, append: appendMeter, remove: removeMeter } = useFieldArray({
    control,
    name: 'meters'
  });

  const watchAll = watch();

  const handleNextStep = async () => {
    // Validate Step 1 before proceeding
    const isStep1Valid = await trigger(['name', 'room_type', 'area', 'capacity', 'base_price']);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const onSubmit = (data: RoomTemplateFormData) => {
    onSave(data);
  };

  const toggleMeter = (type: 'ELECTRIC' | 'WATER') => {
    const existingIndex = meterFields.findIndex(m => m.type === type);
    if (existingIndex !== -1) {
      removeMeter(existingIndex);
    } else {
      appendMeter({ type });
    }
  };

  const hasMeter = (type: string) => meterFields.some(m => m.type === type);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* LEFT: FORM MAIN */}
      <div className="lg:col-span-2 space-y-8">
        <form id="room-template-form" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none rounded-[2.5rem] overflow-hidden">
            {/* Header / Wizard Nav */}
            <div className="px-10 pt-10 pb-6 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {initialData ? 'Chỉnh sửa mẫu phòng' : 'Tạo mẫu phòng mới'}
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                  Thiết lập các thông số cơ bản và tiện ích đi kèm.
                </p>
              </div>
              <div className="flex gap-3">
                {[1, 2].map(s => (
                  <div key={s} className="flex gap-2 items-center">
                    <div className={`w-3 h-3 rounded-full transition-all ${step === s ? 'bg-indigo-500 scale-125' : step > s ? 'bg-indigo-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 hidden sm:block">Bước {s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Name */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tên biểu mẫu <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          {...register('name')}
                          placeholder="Ví dụ: Căn hộ Studio cao cấp"
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                      {errors.name && <p className="text-sm text-rose-500 ml-1">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Room Type */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Loại phòng <span className="text-rose-500">*</span></label>
                        <select
                          {...register('room_type')}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        >
                          {ROOM_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        {errors.room_type && <p className="text-sm text-rose-500 ml-1">{errors.room_type.message}</p>}
                      </div>

                      {/* Base Price */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Giá thuê mặc định (VNĐ) <span className="text-rose-500">*</span></label>
                        <div className="relative group">
                          <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                          <input
                            value={formatNumber(watchAll.base_price)}
                            onChange={(e) => setValue('base_price', Number(parseNumber(e.target.value)) || 0, { shouldValidate: true })}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          />
                        </div>
                        {errors.base_price && <p className="text-sm text-rose-500 ml-1">{errors.base_price.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Area */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Diện tích (m²) <span className="text-rose-500">*</span></label>
                        <div className="relative group">
                          <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                          <input
                            type="number"
                            step="0.1"
                            {...register('area', { valueAsNumber: true })}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                        {errors.area && <p className="text-sm text-rose-500 ml-1">{errors.area.message}</p>}
                      </div>

                      {/* Capacity */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sức chứa tối đa (người) <span className="text-rose-500">*</span></label>
                        <div className="relative group">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                          <input
                            type="number"
                            {...register('capacity', { valueAsNumber: true })}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                        {errors.capacity && <p className="text-sm text-rose-500 ml-1">{errors.capacity.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Meters */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                          <Gauge className="w-5 h-5 text-indigo-500" />
                        </div>
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Công tơ & Tiện ích <span className="text-rose-500">*</span></label>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => toggleMeter('ELECTRIC')}
                          className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                            hasMeter('ELECTRIC')
                              ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5" />
                            <span className="font-black text-sm uppercase">Công tơ điện</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hasMeter('ELECTRIC') ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {hasMeter('ELECTRIC') && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleMeter('WATER')}
                          className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                            hasMeter('WATER')
                              ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Gauge className="w-5 h-5" />
                            <span className="font-black text-sm uppercase">Công tơ nước</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hasMeter('WATER') ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {hasMeter('WATER') && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      </div>
                      {errors.meters && <p className="text-sm text-rose-500 ml-1">Vui lòng chọn ít nhất một loại đồng hồ/công tơ</p>}
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Assets */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-violet-500/10 rounded-xl">
                            <Box className="w-5 h-5 text-violet-500" />
                          </div>
                          <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Danh sách nội thất</label>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => appendAsset({ name: '' })} 
                          className="px-4 py-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Thêm nội thất
                        </button>
                      </div>

                      <div className="space-y-3">
                        <AnimatePresence>
                          {assetFields.map((field, idx) => (
                            <motion.div 
                              key={field.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex gap-4 items-start group"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="relative">
                                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input
                                    {...register(`assets.${idx}.name` as const)}
                                    placeholder="Ví dụ: Điều hòa Inverter 1HP"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none font-bold text-sm text-slate-900 dark:text-white focus:border-violet-500 transition-colors"
                                  />
                                </div>
                                {errors.assets?.[idx]?.name && <p className="text-xs text-rose-500 ml-1">{errors.assets[idx]?.name?.message}</p>}
                              </div>
                              <ActionButton 
                                variant="glass" 
                                size="sm" 
                                icon={Trash2}
                                label=""
                                type="button"
                                onClick={() => removeAsset(idx)} 
                                className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 mt-1" 
                                title="Xóa nội thất"
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {assetFields.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                            <Box className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Không có cấu hình nội thất mặc định</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Phòng tạo từ mẫu này sẽ trống nội thất.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 flex gap-4">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-3"
              >
                <ArrowLeft className="w-5 h-5" /> Quay lại
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30 active:scale-95 flex items-center justify-center gap-3"
              >
                Tiếp tục <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 dark:shadow-emerald-900/30 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Check className="w-5 h-5" /> Hoàn tất & Lưu mẫu</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT: STICKY SIDEBAR / LIVE PREVIEW */}
      <div className="lg:col-span-1 lg:sticky lg:top-8">
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mx-20 -my-20 group-hover:bg-indigo-500/30 transition-all duration-700" />
          
          <div className="relative">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> THÔNG TIN TỔNG QUAN
            </h4>

            <div className="space-y-6">
              <div className="mb-8">
                <p className="text-sm font-medium text-slate-400 mb-1">Tên biểu mẫu</p>
                <div className="text-2xl font-black leading-tight">
                  {watchAll.name || <span className="text-slate-600 italic">Chưa đặt tên</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Loại phòng</p>
                  <p className="font-bold capitalize">{ROOM_TYPES.find(r => r.value === watchAll.room_type)?.label || 'Tiêu chuẩn'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sức chứa</p>
                  <p className="font-bold flex items-center gap-1"><Users className="w-4 h-4 text-blue-400" /> {watchAll.capacity || 0} người</p>
                </div>
              </div>

              <div className="border-b border-slate-800 pb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tài nguyên yêu cầu</p>
                
                <div className="space-y-4">
                  {/* Area Metric */}
                  <div className="bg-slate-800/50 rounded-2xl p-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-bold text-slate-300">Diện tích</span>
                      <span className="text-lg font-black text-white">{watchAll.area || 0} <span className="text-xs font-bold text-slate-400">m²</span></span>
                    </div>
                    {propertyArea ? (
                      <div>
                        {/* Fake progress bar visualizing context */}
                        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
                          <motion.div 
                            className="h-full bg-indigo-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((watchAll.area / propertyArea) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">
                          Chiếm <span className="text-indigo-400">{((watchAll.area / propertyArea) * 100).toFixed(1)}%</span> tổng diện tích tòa nhà ({propertyArea} m²)
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500">Khu trọ chưa cấu hình tổng diện tích</p>
                    )}
                  </div>

                  <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-300">Nội thất</span>
                    <span className="px-3 py-1 bg-violet-500/20 text-violet-400 text-xs font-black rounded-full">{watchAll.assets?.length || 0} món</span>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-300">Đồng hồ phụ</span>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-black rounded-full">{watchAll.meters?.length || 0} loại</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá dự định (VNĐ)</p>
                <div className="text-3xl font-black text-emerald-400 tracking-tighter shrink-0 truncate">
                  {formatNumber(watchAll.base_price || 0)}
                  <span className="text-sm text-emerald-600 ml-1">đ/tháng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
