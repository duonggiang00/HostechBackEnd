import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Zap, Droplets } from 'lucide-react';
import type { Service, ServiceFormData } from '../types';

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
  calc_mode: z.enum(['PER_ROOM', 'PER_PERSON', 'PER_QUANTITY', 'PER_METER']),
  unit: z.string().min(1, 'Đơn vị tính không được để trống'),
  is_recurring: z.boolean(),
  is_active: z.boolean(),
  price: z.number().min(0, 'Đơn giá không được âm'),
  tiered_rates: z.array(tierSchema).optional(),
});

type FormValues = z.infer<typeof serviceSchema>;

interface Props {
  initialData?: Service;
  onSubmit: (data: ServiceFormData) => void;
}

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

export default function ServiceForm({ initialData, onSubmit }: Props) {
  const defaultValues: FormValues = initialData ? {
    code: initialData.code,
    name: initialData.name,
    calc_mode: initialData.calc_mode,
    unit: initialData.unit,
    is_recurring: initialData.is_recurring,
    is_active: initialData.is_active,
    price: initialData.current_price || 0,
    tiered_rates: initialData.rates?.[0]?.tiered_rates?.map(t => ({
      tier_from: t.tier_from,
      tier_to: t.tier_to,
      price: t.price
    })) || [],
  } : {
    code: '',
    name: '',
    calc_mode: 'PER_ROOM',
    unit: 'Phòng',
    is_recurring: true,
    is_active: true,
    price: 0,
    tiered_rates: [],
  };

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues,
  });

  const calcMode = watch('calc_mode');
  const showTieredRates = calcMode === 'PER_METER';

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tiered_rates',
  });

  // Tự động sync field_to = field_from của bậc tiếp theo.
  // Trong UI thực tế có thể dùng useEffect lắng nghe fields. Nhưng để đơn giản, ta chỉ validate.

  const loadPreset = (type: 'electric' | 'water') => {
    if (type === 'electric') {
      setValue('calc_mode', 'PER_METER');
      setValue('unit', 'kWh');
      setValue('tiered_rates', PRESETS.electric_6_tiers);
    } else {
      setValue('calc_mode', 'PER_METER');
      setValue('unit', 'Khối');
      setValue('tiered_rates', PRESETS.water_4_tiers);
    }
  };

  const handleFormSubmit = (data: FormValues) => {
    // Clean up tiered_rates if not PER_METER
    if (data.calc_mode !== 'PER_METER') {
      data.tiered_rates = [];
    }
    onSubmit(data as ServiceFormData);
  };

  return (
    <form id="service-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[#111827] dark:text-white mb-6">Thông tin dịch vụ</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Mã dịch vụ <span className="text-red-500">*</span>
            </label>
            <input
              {...register('code')}
              disabled={!!initialData} // Không cho sửa code nếu đang update
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none disabled:opacity-50"
              placeholder="VD: DIEN, NUOC..."
            />
            {errors.code && <p className="mt-1.5 text-sm text-red-500">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">
              Tên dịch vụ <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none"
              placeholder="VD: Tiền điện, Tiền nước sinh hoạt..."
            />
            {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">
              Cách tính phí
            </label>
            <select
              {...register('calc_mode')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none"
            >
              <option value="PER_ROOM">Chỉ số cố định theo phòng (VND/Phòng)</option>
              <option value="PER_PERSON">Theo người (VND/Người)</option>
              <option value="PER_QUANTITY">Theo số lượng (VND/Cái)</option>
              <option value="PER_METER">Theo chỉ số đồng hồ (Điện, Nước)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">
              Đơn vị tính <span className="text-red-500">*</span>
            </label>
            <input
              {...register('unit')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none"
              placeholder="VD: Phòng, Người, kWh, Khối..."
            />
            {errors.unit && <p className="mt-1.5 text-sm text-red-500">{errors.unit.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#4B5563] dark:text-slate-300 mb-1.5">
              Đơn giá cơ bản (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('price', { valueAsNumber: true })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none text-lg font-semibold text-[#111827] dark:text-white"
            />
            <p className="text-xs text-slate-500 mt-1">Đơn giá này áp dụng mặc định. Nếu thiết lập bậc thang, mảng giá bậc thang sẽ ghi đè giá này khi tính chỉ số.</p>
            {errors.price && <p className="mt-1.5 text-sm text-red-500">{errors.price.message}</p>}
          </div>
        </div>

        {/* Toggles */}
        <div className="mt-8 flex flex-col sm:flex-row gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                {...register('is_recurring')} 
                className="w-5 h-5 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" 
              />
            </div>
            <span className="text-sm font-medium text-[#4B5563] dark:text-slate-300 group-hover:text-[#111827] transition-colors">Tự động thêm vào hóa đơn tháng</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                {...register('is_active')} 
                className="w-5 h-5 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" 
              />
            </div>
            <span className="text-sm font-medium text-[#4B5563] dark:text-slate-300 group-hover:text-[#111827] transition-colors">Hoạt động (Cho phép sử dụng)</span>
          </label>
        </div>
      </div>

      {/* Tiered Rates Section */}
      {showTieredRates && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">Cấu hình giá bậc thang</h2>
              <p className="text-sm text-[#4B5563] mt-1">Sử dụng cho Điện và Nước (lũy tiến).</p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadPreset('electric')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors border border-amber-200 dark:border-amber-500/20"
              >
                <Zap className="w-4 h-4" />
                Điện 6 bậc
              </button>
              <button
                type="button"
                onClick={() => loadPreset('water')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-500/20"
              >
                <Droplets className="w-4 h-4" />
                Nước 4 bậc
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex-1 w-full relative">
                  <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">Từ mức</label>
                  <input
                    type="number"
                    {...register(`tiered_rates.${index}.tier_from` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none"
                  />
                  {errors.tiered_rates?.[index]?.tier_from && (
                    <span className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.tiered_rates[index]?.tier_from?.message}</span>
                  )}
                </div>

                <div className="flex-1 w-full relative">
                  <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">Đến mức</label>
                  <input
                    type="number"
                    {...register(`tiered_rates.${index}.tier_to` as const, { 
                      setValueAs: v => v === '' ? null : parseInt(v, 10) 
                    })}
                    placeholder="Không giới hạn"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none"
                  />
                  {errors.tiered_rates?.[index]?.tier_to && (
                    <span className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.tiered_rates[index]?.tier_to?.message}</span>
                  )}
                </div>

                <div className="flex-1 w-full relative">
                  <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">Đơn giá (VND)</label>
                  <input
                    type="number"
                    {...register(`tiered_rates.${index}.price` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none font-medium text-[#111827] dark:text-white"
                  />
                  {errors.tiered_rates?.[index]?.price && (
                    <span className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.tiered_rates[index]?.price?.message}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2.5 text-[#4B5563] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Xóa bậc này"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ tier_from: 0, tier_to: null, price: 0 })}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-[#4B5563] hover:text-[#1E3A8A] hover:border-[#1E3A8A]/30 dark:hover:text-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              Thêm một bậc giá
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
