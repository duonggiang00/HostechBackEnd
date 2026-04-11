import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Zap, Droplets } from 'lucide-react';
import { useServiceDetail, useUpdateService, useCreateService } from '../hooks/useServices';
import { toast } from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ServiceFormData } from '../types';

const tierSchema = z.object({
  tier_from: z.number().min(0, 'Phải lớn hơn hoặc bằng 0'),
  tier_to: z.number().nullable(),
  price: z.number().min(0, 'Giá không được âm'),
}).refine((data) => data.tier_to === null || data.tier_to > data.tier_from, {
  message: 'Đến mức phải lớn hơn Từ mức',
  path: ['tier_to']
});

const serviceSchema = z.object({
  code: z.string().min(1, 'Mã dịch vụ không được để trống'),
  name: z.string().min(1, 'Tên dịch vụ không được để trống'),
  type: z.enum(['ELECTRIC', 'WATER', 'OTHER']),
  calc_mode: z.enum(['PER_ROOM', 'PER_PERSON', 'PER_QUANTITY', 'PER_METER']),
  unit: z.string().min(1, 'Đơn vị tính không được để trống'),
  is_recurring: z.boolean(),
  is_active: z.boolean(),
  price: z.number().min(0, 'Đơn giá không được âm'),
  tiered_rates: z.array(tierSchema).optional(),
});

type FormValues = z.infer<typeof serviceSchema>;

const PRESETS = {
  electric_6_tiers: [
    { tier_from: 0, tier_to: 50, price: 1806 },
    { tier_from: 50, tier_to: 100, price: 1866 },
    { tier_from: 100, tier_to: 200, price: 2167 },
    { tier_from: 200, tier_to: 300, price: 2729 },
    { tier_from: 300, tier_to: 400, price: 3050 },
    { tier_from: 400, tier_to: null, price: 3151 },
  ],
  water_4_tiers: [
    { tier_from: 0, tier_to: 10, price: 5973 },
    { tier_from: 10, tier_to: 20, price: 7052 },
    { tier_from: 20, tier_to: 30, price: 8669 },
    { tier_from: 30, tier_to: null, price: 15929 },
  ]
};

export default function ServiceFormPage() {
  const navigate = useNavigate();
  const { propertyId, serviceId } = useParams<{ propertyId: string; serviceId: string }>();
  
  const isEditMode = !!serviceId;

  const { data: service, isLoading } = useServiceDetail(serviceId || '');
  const updateMutation = useUpdateService();
  const createMutation = useCreateService();

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  const { register, control, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'OTHER',
      calc_mode: 'PER_ROOM',
      unit: 'Phòng',
      is_recurring: true,
      is_active: true,
      price: 0,
      tiered_rates: [],
    },
  });

  useEffect(() => {
    if (isEditMode && service) {
      reset({
        code: service.code,
        name: service.name,
        type: service.type || 'OTHER',
        calc_mode: service.calc_mode,
        unit: service.unit,
        is_recurring: service.is_recurring,
        is_active: service.is_active,
        price: service.current_price || 0,
        tiered_rates: service.rates?.[0]?.tiered_rates?.map(t => ({
          tier_from: t.tier_from,
          tier_to: t.tier_to,
          price: t.price
        })) || [],
      });
    }
  }, [service, isEditMode, reset]);

  const calcMode = watch('calc_mode');
  const showTieredRates = calcMode === 'PER_METER';
  const watchedTieredRates = watch('tiered_rates');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tiered_rates',
  });

  useEffect(() => {
    if (watchedTieredRates && watchedTieredRates.length > 1) {
      watchedTieredRates.forEach((tier, index) => {
        if (index < watchedTieredRates.length - 1) {
          const currentTo = tier.tier_to;
          const nextFrom = watchedTieredRates[index + 1].tier_from;
          if (currentTo !== null && currentTo !== nextFrom) {
            setValue(`tiered_rates.${index + 1}.tier_from`, currentTo);
          }
        }
      });
    }
  }, [watchedTieredRates, setValue]);

  const loadPreset = (type: 'electric' | 'water') => {
    if (type === 'electric') {
      setValue('type', 'ELECTRIC');
      setValue('calc_mode', 'PER_METER');
      setValue('unit', 'kWh');
      setValue('tiered_rates', PRESETS.electric_6_tiers);
    } else {
      setValue('type', 'WATER');
      setValue('calc_mode', 'PER_METER');
      setValue('unit', 'Khối');
      setValue('tiered_rates', PRESETS.water_4_tiers);
    }
  };

  const handleFormSubmit = async (data: FormValues) => {
    if (data.calc_mode !== 'PER_METER') {
      data.tiered_rates = [];
    }
    
    try {
      if (isEditMode && serviceId) {
        await updateMutation.mutateAsync({ id: serviceId, data: data as ServiceFormData });
        toast.success('Dịch vụ đã được cập nhật thành công');
      } else {
        await createMutation.mutateAsync(data as ServiceFormData);
        toast.success('Dịch vụ đã được tạo thành công');
      }
      navigate(`/properties/${propertyId}/services`);
    } catch {
      toast.error(`Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} dịch vụ`);
    }
  };

  const getTierColor = (index: number) => {
    if (index === 0) return 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5';
    if (index < 3) return 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-500/5';
    if (index < 5) return 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-500/5';
    return 'border-l-rose-500 bg-rose-50/30 dark:bg-rose-500/5';
  };

  const getTierBadgeColor = (index: number) => {
    if (index === 0) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
    if (index < 3) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    if (index < 5) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEditMode && !service) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy dịch vụ cần sửa.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-[#4B5563] dark:text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] dark:text-white">
              {isEditMode ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
            </h1>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1">
              {isEditMode ? `${service?.name} (${service?.code})` : 'Định nghĩa cấu hình dịch vụ và bảng giá mới'}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] shadow-sm transition-all focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 disabled:opacity-50 font-semibold"
        >
          <Save className="w-5 h-5" />
          {isPending ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Lưu dịch vụ')}
        </button>
      </div>

      {/* FORM BODY */}
      <div className="p-6 sm:p-8 space-y-8">
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mã dịch vụ <span className="text-red-500">*</span></label>
            <input
              {...register('code')}
              disabled={isEditMode}
              placeholder="VD: DIEN, NUOC..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none disabled:opacity-50"
            />
            {errors.code && <p className="mt-1.5 text-sm text-red-500">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">Tên dịch vụ <span className="text-red-500">*</span></label>
            <input
              {...register('name')}
              placeholder="VD: Tiền điện, Tiền nước..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none"
            />
            {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">Cách tính phí</label>
            <select
              {...register('calc_mode')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none cursor-pointer"
            >
              <option value="PER_ROOM">Chỉ số cố định theo phòng (VND/Phòng)</option>
              <option value="PER_PERSON">Theo người (VND/Người)</option>
              <option value="PER_QUANTITY">Theo số lượng (VND/Cái)</option>
              <option value="PER_METER">Giá bậc thang (Điện, Nước)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">Phân loại dịch vụ</label>
            <select
              {...register('type')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none cursor-pointer"
            >
              <option value="OTHER">Dịch vụ thường</option>
              <option value="ELECTRIC">Hệ thống Điện</option>
              <option value="WATER">Hệ thống Nước sinh hoạt</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">Đơn vị tính <span className="text-red-500">*</span></label>
            <input
              {...register('unit')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none"
              placeholder="VD: Phòng, Người, kWh, Khối..."
            />
            {errors.unit && <p className="mt-1.5 text-sm text-red-500">{errors.unit.message}</p>}
          </div>
        </div>

        {/* Pricing configuration */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#111827] dark:text-white">Cấu hình Đơn giá</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Thiết lập giá cơ bản hoặc giá bậc thang cho dịch vụ</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => loadPreset('electric')} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 rounded-lg border border-amber-200 dark:border-amber-500/20 transition-colors">
                <Zap className="w-4 h-4" /> Điền nhanh bậc Điện
              </button>
              <button type="button" onClick={() => loadPreset('water')} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-colors">
                <Droplets className="w-4 h-4" /> Điền nhanh bậc Nước
              </button>
            </div>
          </div>

          {!showTieredRates ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">Đơn giá cơ bản (VND) <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none"
              />
              {errors.price && <p className="mt-1.5 text-sm text-red-500">{errors.price.message}</p>}
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Đơn giá này áp dụng mặc định.</p>
            </div>
          ) : (
            <div className="space-y-4">

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const isInfinity = index === fields.length - 1 && watchedTieredRates[index]?.tier_to === null;
                  
                  return (
                    <div key={field.id} className={`flex flex-col sm:flex-row items-stretch sm:items-start gap-4 p-4 border rounded-xl relative transition-all ${getTierColor(index)}`}>
                      <div className={`hidden sm:flex shrink-0 w-16 h-10 ${getTierBadgeColor(index)} rounded-lg items-center justify-center font-bold text-sm border border-current opacity-70`}>Bậc {index + 1}</div>
                      
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block sm:hidden text-xs font-semibold text-slate-500 mb-1">Bậc {index + 1} - Từ mức</label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500 w-16 hidden sm:inline-block">Từ mức</span>
                            <div className="relative flex-1">
                              <input
                                type="number"
                                {...register(`tiered_rates.${index}.tier_from`, { valueAsNumber: true })}
                                disabled={index > 0}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] disabled:opacity-50 disabled:bg-slate-50"
                              />
                            </div>
                          </div>
                          {errors.tiered_rates?.[index]?.tier_from && <p className="mt-1 text-xs text-red-500">{errors.tiered_rates[index]?.tier_from?.message}</p>}
                        </div>

                        <div>
                          <label className="block sm:hidden text-xs font-semibold text-slate-500 mb-1">Đến mức</label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500 w-16 hidden sm:inline-block">Đến mức</span>
                            <div className="relative flex-1">
                              <input
                                type="number"
                                {...register(`tiered_rates.${index}.tier_to`, { 
                                  setValueAs: v => v === '' ? null : Number(v)
                                })}
                                placeholder="Trở lên..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] placeholder:text-slate-400"
                              />
                              {isInfinity && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 pointer-events-none">MAX</div>
                              )}
                            </div>
                          </div>
                          {errors.tiered_rates?.[index]?.tier_to && <p className="mt-1 text-xs text-red-500">{errors.tiered_rates[index]?.tier_to?.message}</p>}
                        </div>

                        <div>
                          <label className="block sm:hidden text-xs font-semibold text-slate-500 mb-1">Giá (VND)</label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500 w-12 hidden sm:inline-block">Giá</span>
                            <div className="relative flex-1">
                              <input
                                type="number"
                                {...register(`tiered_rates.${index}.price`, { valueAsNumber: true })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A]"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">đ</span>
                            </div>
                          </div>
                          {errors.tiered_rates?.[index]?.price && <p className="mt-1 text-xs text-red-500">{errors.tiered_rates[index]?.price?.message}</p>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="sm:w-10 h-10 w-full shrink-0 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                        title="Xóa bậc này"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sm:hidden ml-2 font-medium">Xóa bậc này</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  const lastTier = watchedTieredRates?.[watchedTieredRates.length - 1];
                  append({
                    tier_from: lastTier?.tier_to ?? 0,
                    tier_to: null,
                    price: 0
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1E3A8A] dark:text-indigo-400 bg-[#1E3A8A]/5 hover:bg-[#1E3A8A]/10 dark:bg-indigo-400/10 dark:hover:bg-indigo-400/20 rounded-lg transition-colors border border-[#1E3A8A]/10 dark:border-indigo-400/20 w-full sm:w-auto mt-2"
              >
                <Plus className="w-4 h-4" />
                Thêm một bậc giá
              </button>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input type="checkbox" {...register('is_recurring')} className="w-5 h-5 text-[#1E3A8A] rounded border-slate-300 focus:ring-[#1E3A8A] transition-colors cursor-pointer" />
            </div>
            <span className="text-sm font-medium text-[#4B5563] dark:text-slate-300 group-hover:text-[#111827] dark:group-hover:text-white transition-colors">
              Tự động thêm vào hóa đơn tháng
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input type="checkbox" {...register('is_active')} className="w-5 h-5 text-[#1E3A8A] rounded border-slate-300 focus:ring-[#1E3A8A] transition-colors cursor-pointer" />
            </div>
            <span className="text-sm font-medium text-[#4B5563] dark:text-slate-300 group-hover:text-[#111827] dark:group-hover:text-white transition-colors">
              Hoạt động (Cho phép sử dụng)
            </span>
          </label>
        </div>
      </div>
    </form>
  );
}
