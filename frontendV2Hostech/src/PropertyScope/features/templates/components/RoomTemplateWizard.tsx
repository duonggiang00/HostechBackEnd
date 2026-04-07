import { useState, useEffect, useMemo } from 'react';
import { 
  Home, Users, Maximize2, DollarSign, Zap, 
  ShieldAlert, X, Check, Loader2, ArrowRight, ArrowLeft,
  Package, Layout, FileText, Info
} from 'lucide-react';
import { useRoomTemplateActions } from '../hooks/useTemplates';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatNumber, parseNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ServicePicker from '@/shared/features/billing/components/ServicePicker';
import type { RoomTemplate } from '../types';
import { useRooms } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { useFloors } from '@/PropertyScope/hooks/useFloors';


interface RoomTemplateWizardProps {
  initialData?: RoomTemplate | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyId: string;
}

const ROOM_TYPES = [
  { value: 'apartment', label: 'Căn hộ dịch vụ', icon: Home },
  { value: 'studio', label: 'Studio', icon: Layout },
  { value: 'dorm', label: 'Ký túc xá', icon: Users },
  { value: 'house', label: 'Nhà nguyên căn', icon: Package },
];

const STEPS = [
  { id: 'basic', title: 'Thông tin mẫu', icon: Layout },
  { id: 'services', title: 'Dịch vụ', icon: Zap },
  { id: 'assets', title: 'Tài sản', icon: Package },
];

export function RoomTemplateWizard({ initialData, onSuccess, onCancel, propertyId }: RoomTemplateWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const { createTemplate, updateTemplate } = useRoomTemplateActions(propertyId);
  const { data: property } = usePropertyDetail(propertyId);
  // Data Fetching for Context (Rooms & Floors)
  const { data: rooms = [] } = useRooms({ property_id: propertyId });
  const { data: floors = [] } = useFloors(propertyId);

  const inheritedServiceIds = useMemo(() => {
    return property?.default_services?.map((s: any) => s.id || s) || [];
  }, [property]);

  // Form State
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    room_type: initialData?.room_type ?? 'standard',
    capacity: initialData?.capacity ?? 2,
    area: initialData?.area ?? 25,
    base_price: initialData?.base_price ?? 0,
    description: initialData?.description ?? '',
  });

  // Area Statistics Calculation
  const areaStats = useMemo(() => {
    const buildingArea = Number(property?.area || 0);
    const buildingSharedArea = Number(property?.shared_area || 0);
    
    // Group rooms by floor to find "Sum of rooms in 1 floor" context
    const floorGroups: Record<string, number> = {};
    rooms.forEach(r => {
      if (r.floor_id) {
        floorGroups[r.floor_id] = (floorGroups[r.floor_id] || 0) + Number(r.area || 0);
      }
    });

    // Sample floor (use the first floor with rooms, or the first floor in list)
    const sampleFloorId = Object.keys(floorGroups)[0] || (floors && floors[0]?.id);
    const roomsInSampleFloorArea = sampleFloorId ? (floorGroups[sampleFloorId] || 0) : 0;
    const sampleFloorName = floors.find(f => f.id === sampleFloorId)?.name || 'Tầng 1';

    // Calculation: Building Area - Building Shared Area - Rooms in 1 Floor
    const remainingArea = buildingArea - buildingSharedArea - roomsInSampleFloorArea;

    // Price per m2 context
    const pricePerM2 = formData.area > 0 ? formData.base_price / formData.area : 0;

    return {
      buildingArea,
      buildingSharedArea,
      roomsInSampleFloorArea,
      remainingArea,
      sampleFloorName,
      pricePerM2
    };
  }, [property, rooms, floors, formData.area, formData.base_price]);

  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialData?.services?.map((s: any) => typeof s === 'string' ? s : s.id) ?? []
  );
  
  const [assets, setAssets] = useState<Array<{ name: string; condition: string; note: string }>>(
    initialData?.assets?.map((a: any) => ({
      name: a.name,
      condition: a.condition || 'new',
      note: a.note || ''
    })) ?? []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-sync inherited services for NEW template
  useEffect(() => {
    if (!initialData && inheritedServiceIds.length > 0 && selectedServices.length === 0) {
      setSelectedServices(inheritedServiceIds);
    }
  }, [inheritedServiceIds, initialData]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Tên mẫu không được để trống';
      if (formData.area < 10) newErrors.area = 'Diện tích tối thiểu phải từ 10 m²';
      if (formData.base_price <= 0) newErrors.base_price = 'Giá thuê không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast.error('Vui lòng hoàn thành các thông tin bắt buộc');
    }
  };

  const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(0)) {
      setActiveStep(0);
      toast.error('Vui lòng kiểm tra lại thông tin cơ bản');
      return;
    }

    const payload = {
      ...formData,
      services: selectedServices,
      assets: assets.filter(a => a.name.trim()),
    };

    try {
      if (initialData) {
        await updateTemplate.mutateAsync({ id: initialData.id, data: payload });
        toast.success('Cập nhật mẫu phòng thành công');
      } else {
        await createTemplate.mutateAsync(payload);
        toast.success('Tạo mẫu phòng thành công');
      }
      onSuccess?.();
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const isMutating = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="max-w-5xl mx-auto py-4">
      {/* ─── Stepper ─── */}
      <div className="flex items-center justify-between mb-12 px-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          const isCompleted = activeStep > index;

          return (
            <div key={step.id} className="flex-1 flex items-center group">
              <div className="flex flex-col items-center relative">
                <div 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                    isActive 
                      ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200 text-white scale-110' 
                      : isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`absolute -bottom-7 text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-700'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden min-h-[500px] flex flex-col">
        {/* ─── Step Content ─── */}
        <div className="p-8 md:p-12 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeStep === 0 && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* ─── Area Context Integrated (Top Banner) ─── */}
                  <div className="bg-slate-900/5 dark:bg-slate-900/20 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-[40px] p-8 shadow-inner-white">
                    <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200 mb-8">
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <ShieldAlert className="w-5 h-5 text-indigo-500" />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-widest">Bối cảnh diện tích tòa nhà</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="p-6 bg-white/60 dark:bg-slate-800/40 rounded-[28px] border border-white/80 dark:border-slate-700/30 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tổng diện tích</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{formatNumber(areaStats.buildingArea)}<span className="text-sm font-bold text-slate-400 ml-1">m²</span></p>
                      </div>
                      <div className="p-6 bg-white/60 dark:bg-slate-800/40 rounded-[28px] border border-white/80 dark:border-slate-700/30 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Diện tích chung</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{formatNumber(areaStats.buildingSharedArea)}<span className="text-sm font-bold text-slate-400 ml-1">m²</span></p>
                      </div>
                      <div className="p-6 bg-white/60 dark:bg-slate-800/40 rounded-[28px] border border-white/80 dark:border-slate-700/30 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DT phòng ({areaStats.sampleFloorName})</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{formatNumber(areaStats.roomsInSampleFloorArea)}<span className="text-sm font-bold text-slate-400 ml-1">m²</span></p>
                      </div>
                      <div className="group p-6 bg-indigo-600 rounded-[28px] shadow-xl shadow-indigo-600/20 border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 cursor-default relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all" />
                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2 relative z-10">Giá thuê / m²</p>
                        <p className="text-2xl font-black text-white tabular-nums relative z-10">{formatCurrency(areaStats.pricePerM2).replace('₫', '')}<span className="text-sm font-bold opacity-60 ml-1">₫</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                      {/* Section: Basic Info */}
                      <section className="bg-white dark:bg-slate-900/60 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
                           <Layout className="w-5 h-5 text-indigo-500" />
                           <h2 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">Thông tin cơ bản</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight ml-1">Tên mẫu phòng</label>
                            <div className="relative group">
                              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                              <input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white"
                                placeholder="e.g. Mẫu phòng Standard"
                              />
                            </div>
                            {errors.name && <p className="text-xs text-rose-500 font-bold flex items-center gap-1 ml-1">{errors.name}</p>}
                          </div>

                          <div className="space-y-3">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight ml-1">Loại phòng</label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {ROOM_TYPES.map(t => (
                                <button
                                  key={t.value}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, room_type: t.value })}
                                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 group/btn ${
                                    formData.room_type === t.value 
                                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' 
                                      : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200'
                                  }`}
                                >
                                  <div className={`p-2 rounded-xl transition-colors ${formData.room_type === t.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover/btn:bg-indigo-100'}`}>
                                    <t.icon className="w-4 h-4" />
                                  </div>
                                  <span className={`font-black uppercase tracking-widest text-[8px] text-center leading-tight ${formData.room_type === t.value ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {t.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight ml-1">Diện tích (m²)</label>
                            <div className="relative group">
                              <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                              <input
                                type="text"
                                value={formatNumber(formData.area)}
                                onChange={e => setFormData({ ...formData, area: Number(parseNumber(e.target.value)) })}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight ml-1">Sức chứa tối đa</label>
                            <div className="relative group">
                              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                              <input
                                type="text"
                                value={formatNumber(formData.capacity)}
                                onChange={e => setFormData({ ...formData, capacity: Number(parseNumber(e.target.value)) })}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Section: Pricing & Description */}
                      <section className="bg-white dark:bg-slate-900/60 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
                           <DollarSign className="w-5 h-5 text-emerald-500" />
                           <h2 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">Giá thuê & Mô tả</h2>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight ml-1">Giá thuê mặc định (₫)</label>
                          <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="text"
                              value={formatCurrency(formData.base_price).replace('₫', '').trim()} 
                              onChange={e => setFormData({ ...formData, base_price: Number(parseNumber(e.target.value)) })}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-emerald-950/20 border border-slate-100 dark:border-emerald-900/40 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition-all font-black text-xl text-emerald-700 dark:text-emerald-400 shadow-inner-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight ml-1">Ghi chú tiêu chuẩn</label>
                          <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[32px] outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all font-bold text-slate-600 dark:text-slate-400 placeholder:font-medium placeholder:italic"
                            placeholder="Mô tả các đặc tính của lựa chọn này (ví dụ: gác lửng, cửa sổ thoáng...)"
                          />
                        </div>
                      </section>
                    </div>

                    {/* ─── Premium Preview Card (Sidebar) ─── */}
                    <div className="lg:col-span-4">
                      <div className="sticky top-8 space-y-6">
                        <section className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden relative">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl" />
                          
                          <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Xem trước</span>
                              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                {ROOM_TYPES.find(r => r.value === formData.room_type)?.icon && (
                                  <div className="w-5 h-5 flex items-center justify-center">
                                    {(ROOM_TYPES.find(r => r.value === formData.room_type)?.icon as any)({ className: "w-full h-full" })}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-2xl font-black truncate">{formData.name || 'Tên mẫu phòng'}</h3>
                              <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">
                                {ROOM_TYPES.find(r => r.value === formData.room_type)?.label || 'Tiêu chuẩn'}
                              </p>
                            </div>

                            <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Giá thuê</p>
                                <p className="text-lg font-black tabular-nums">{formatCurrency(formData.base_price)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Diện tích</p>
                                <p className="text-lg font-black tabular-nums">{formData.area} <span className="text-xs">m²</span></p>
                              </div>
                            </div>

                            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Chỉ số tổng quan</p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-indigo-100">Giá / m²</span>
                                  <span className="font-black tabular-nums">{formatCurrency(areaStats.pricePerM2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-indigo-100">Sức chứa</span>
                                  <span className="font-black tabular-nums">{formData.capacity} người</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-medium">
                          <Info className="w-4 h-4 text-indigo-500 mb-2" />
                          <p>Mẫu phòng này giúp bạn tạo nhanh hàng loạt phòng có cùng đặc điểm kỹ thuật và dịch vụ.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-slate-700 mb-8">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white">Dịch vụ mặc định</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Chọn các dịch vụ sẽ được tự động áp dụng khi tạo phòng từ mẫu này.</p>
                    </div>
                  </div>
                  <ServicePicker 
                    selectedServiceIds={selectedServices} 
                    onChange={setSelectedServices}
                    inheritedServiceIds={inheritedServiceIds}
                  />
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Danh mục nội thất mặc định</h3>
                    <button 
                      onClick={() => setAssets([...assets, { name: '', condition: 'new', note: '' }])}
                      className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-black hover:bg-slate-900 dark:hover:bg-slate-600 transition-all active:scale-95"
                    >
                      + Thêm tài sản
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                    {assets.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[32px]">
                        <Package className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-600 font-bold uppercase text-xs tracking-widest">Chưa có tài sản mặc định nào</p>
                      </div>
                    )}
                    {assets.map((asset, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden group p-4 flex gap-4 items-center">
                        <input 
                          placeholder="Tên tài sản (VD: Giường, Tủ...)"
                          value={asset.name}
                          onChange={e => {
                            const newAssets = [...assets];
                            newAssets[i].name = e.target.value;
                            setAssets(newAssets);
                          }}
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 dark:text-white"
                        />
                        <select
                          value={asset.condition}
                          onChange={e => {
                            const newAssets = [...assets];
                            newAssets[i].condition = e.target.value;
                            setAssets(newAssets);
                          }}
                          className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none font-black text-xs uppercase w-24 text-slate-800 dark:text-white"
                        >
                          <option value="new">Mới</option>
                          <option value="good">Tốt</option>
                          <option value="old">Cũ</option>
                        </select>
                        <button 
                          onClick={() => setAssets(assets.filter((_, idx) => idx !== i))}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Footer Actions ─── */}
        <div className="p-8 md:p-12 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <button 
            type="button" 
            onClick={activeStep === 0 ? onCancel : handleBack}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all uppercase tracking-widest text-xs"
          >
            {activeStep === 0 ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {activeStep === 0 ? 'Hủy bỏ' : 'Quay lại'}
          </button>

          <div className="flex items-center gap-4">
            {activeStep < STEPS.length - 1 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95"
              >
                Tiếp tục
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isMutating}
                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50"
              >
                {isMutating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Lưu mẫu cấu hình
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
