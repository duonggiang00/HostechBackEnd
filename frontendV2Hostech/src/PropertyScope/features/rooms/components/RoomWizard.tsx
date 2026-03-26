import { useState, useMemo, useEffect } from 'react';
import { 
  Home, Tag, Users, Maximize2, DollarSign, ImageIcon, Zap, 
  ShieldAlert, X, Check, Loader2, ArrowRight, ArrowLeft,
  Package, Activity, CloudUpload, Layout, ChevronDown, ChevronUp,
  FileText, Hash, Calendar, Shield
} from 'lucide-react';
import { type Room, useRoomActions, useRooms } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useFloorDetail, useFloors } from '@/PropertyScope/features/floors/hooks/useFloors';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatNumber, parseNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import MediaDropzone from '@/shared/features/media/components/MediaDropzone';
import ServicePicker from '@/shared/features/billing/components/ServicePicker';
import { mediaApi } from '@/shared/features/media/api/media';
import { RoomTemplateSelector } from './RoomTemplateSelector';
import type { RoomTemplate } from '@/PropertyScope/features/templates/types';

interface RoomWizardProps {
  initialData?: Room | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyId: string;
  floorId?: string | null;
}

const ROOM_TYPES = ['standard', 'studio', 'duplex', 'penthouse'] as const;

const STEPS = [
  { id: 'basic', title: 'Cơ bản', icon: Home },
  { id: 'media', title: 'Hình ảnh', icon: ImageIcon },
  { id: 'services', title: 'Dịch vụ', icon: Zap },
  { id: 'assets', title: 'Tài sản', icon: Package },
  { id: 'meters', title: 'Đồng hồ', icon: Activity },
];

export default function RoomWizard({ initialData, onSuccess, onCancel, propertyId, floorId }: RoomWizardProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const { createRoom } = useRoomActions();
  const { data: property } = usePropertyDetail(propertyId);
  const { data: floors = [] } = useFloors(propertyId);
  
  // Form State
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    code: initialData?.code ?? '',
    floor_id: floorId ?? initialData?.floor_id ?? '',
    type: initialData?.type ?? 'standard',
    capacity: initialData?.capacity ?? 2,
    area: initialData?.area ?? 25,
    base_price: initialData?.base_price ?? 5_000_000,
    description: initialData?.description ?? '',
  });

  // Auto-select first floor when no floorId is provided (e.g. from RoomListPage)
  useEffect(() => {
    if (!formData.floor_id && floors.length > 0) {
      setFormData(prev => ({ ...prev, floor_id: floors[0].id }));
    }
  }, [floors, formData.floor_id]);

  const { data: floor } = useFloorDetail(formData.floor_id || undefined);
  const { data: rooms = [] } = useRooms({ 
    property_id: propertyId, 
    floor_id: formData.floor_id || undefined 
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [assets, setAssets] = useState<Array<{ name: string; serial: string; condition: string; purchased_at: string; warranty_end: string; note: string }>>([]);
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set());
  const [meters, setMeters] = useState<Array<{ type: 'ELECTRIC' | 'WATER'; code: string; initial_reading: number }>>([
    { type: 'ELECTRIC', code: '', initial_reading: 0 },
    { type: 'WATER', code: '', initial_reading: 0 },
  ]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTemplateSelect = (template: RoomTemplate) => {
    setSelectedTemplateId(template.id);
    setFormData(prev => ({
      ...prev,
      type: (template.room_type as any) || 'standard',
      capacity: template.capacity || 1,
      area: template.area || 0,
      base_price: template.base_price,
      description: template.description || '',
    }));
    
    // Also pre-select services if template has them
    if (template.services && template.services.length > 0) {
      setSelectedServices(template.services.map((s: any) => typeof s === 'string' ? s : s.id));
    }

    // Pre-fill assets if template has them
    if (template.assets && template.assets.length > 0) {
      setAssets(template.assets.map((a: any) => ({
        name: a.name,
        serial: '',
        condition: 'new',
        purchased_at: '',
        warranty_end: '',
        note: a.note || ''
      })));
    }

    toast.success(`Đã áp dụng mẫu: ${template.name}`);
  };

  const areaLimits = useMemo(() => {
    const buildingArea = Number(property?.area || 0);
    const floorArea = Number(floor?.area || 0);
    const otherRoomsArea = rooms.reduce((sum: number, r: Room) => {
      if (r.id === initialData?.id) return sum;
      return sum + Number(r.area || 0);
    }, 0);
    const sharedArea = floorArea > 0 
      ? Number(floor?.shared_area || 0) 
      : Number(property?.shared_area || 0);

    return {
      buildingArea,
      floorArea,
      otherRoomsArea,
      sharedArea,
      effectiveLimit: floorArea > 0 ? floorArea : buildingArea,
      isUsingFloorLimit: floorArea > 0,
      remainingArea: (floorArea > 0 ? floorArea : buildingArea) - sharedArea - otherRoomsArea
    };
  }, [property, floor, rooms, initialData?.id]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 0) {
      if (formData.area < 10) {
        newErrors.area = 'Diện tích tối thiểu phải từ 10 m²';
      }

      let maxCap = 0;
      if (formData.area >= 10 && formData.area < 20) maxCap = 2;
      else if (formData.area >= 20 && formData.area < 30) maxCap = 3;
      else if (formData.area >= 30 && formData.area < 60) maxCap = 5;
      else if (formData.area >= 60) maxCap = 6;

      if (formData.capacity > 6) {
        newErrors.capacity = 'Số người ở chung không được quá 6 người';
      } else if (maxCap > 0 && formData.capacity > maxCap) {
        newErrors.capacity = `Diện tích ${formData.area} m² chỉ cho phép ở tối đa ${maxCap} người`;
      }

      const { buildingArea, effectiveLimit, otherRoomsArea, sharedArea, isUsingFloorLimit } = areaLimits;
      if (buildingArea > 0 && formData.area > buildingArea) {
        newErrors.area = `Vượt quá tổng diện tích tòa nhà (${buildingArea} m²)`;
      }
      if (effectiveLimit > 0) {
        const totalArea = otherRoomsArea + formData.area + sharedArea;
        if (totalArea > effectiveLimit) {
          const limitType = isUsingFloorLimit ? 'tầng' : 'tòa nhà';
          newErrors.area = `Tổng diện tích (${totalArea} m²) vượt quá giới hạn ${limitType} (${effectiveLimit} m²)`;
        }
      }
    }

    if (step === 4) {
      meters.forEach((m, i) => {
        if (m.code.trim() && !m.type) newErrors[`meter_${i}_type`] = 'Vui lòng chọn loại đồng hồ';
      });
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

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!validateStep(0)) {
      setActiveStep(0);
      toast.error('Vui lòng kiểm tra lại thông tin cơ bản');
      return;
    }

    const payload = {
      ...formData,
      property_id: propertyId,
      status: isDraft ? 'draft' : 'available',
      services: selectedServices,
      assets: assets
        .filter(a => a.name.trim())
        .map(({ name, serial, condition, purchased_at, warranty_end, note }) => ({
          name: name.trim(),
          condition,
          ...(serial?.trim() ? { serial: serial.trim() } : {}),
          ...(purchased_at ? { purchased_at } : {}),
          ...(warranty_end ? { warranty_end } : {}),
          ...(note?.trim() ? { note: note.trim() } : {}),
        })),
      meters: meters.filter(m => m.code.trim()),
    };

    setIsUploading(true);
    try {
      const room = await createRoom.mutateAsync(payload);
      
      // Handle media uploads if any
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(file => 
          mediaApi.uploadFile(file, `rooms/${room.id}`)
        );
        await Promise.all(uploadPromises);
      }

      toast.success(isDraft ? 'Đã lưu tạm phòng' : 'Đã tạo phòng thành công');
      onSuccess?.();
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Có lỗi xảy ra khi tạo phòng');
    } finally {
      setIsUploading(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const isMutating = createRoom.isPending || isUploading;

  return (
    <div className="max-w-5xl mx-auto">
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
                        : 'bg-white border-slate-100 text-slate-400'
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
                <div className={`flex-1 h-0.5 mx-4 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-100'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px] flex flex-col">
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
                <div className="space-y-10">
                  {/* ─── Area Context Banner ─── */}
                  <div className="bg-slate-900/5 backdrop-blur-xl border border-slate-200/60 rounded-[40px] p-8 shadow-inner-white">
                    <div className="flex items-center gap-3 text-slate-800 mb-8">
                      <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <ShieldAlert className="w-5 h-5 text-indigo-500" />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-widest">Bối cảnh diện tích tòa nhà</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="p-6 bg-white/60 rounded-[28px] border border-white/80 shadow-sm transition-all hover:bg-white">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tổng diện tích</p>
                        <p className="text-2xl font-black text-slate-900 tabular-nums">{formatNumber(areaLimits.buildingArea)}<span className="text-sm font-bold text-slate-400 ml-1">m²</span></p>
                      </div>
                      <div className="p-6 bg-white/60 rounded-[28px] border border-white/80 shadow-sm transition-all hover:bg-white">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Diện tích chung</p>
                        <p className="text-2xl font-black text-slate-900 tabular-nums">{formatNumber(areaLimits.sharedArea)}<span className="text-sm font-bold text-slate-400 ml-1">m²</span></p>
                      </div>
                      <div className="p-6 bg-white/60 rounded-[28px] border border-white/80 shadow-sm transition-all hover:bg-white">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DT phòng {areaLimits.isUsingFloorLimit ? '(Tầng)' : '(Tòa)'}</p>
                        <p className="text-2xl font-black text-slate-900 tabular-nums">{formatNumber(areaLimits.otherRoomsArea)}<span className="text-sm font-bold text-slate-400 ml-1">m²</span></p>
                      </div>
                      <div className="group p-6 bg-indigo-600 rounded-[28px] shadow-xl shadow-indigo-600/20 border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 cursor-default relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all" />
                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2 relative z-10">Khả dụng còn lại</p>
                        <p className="text-2xl font-black text-white tabular-nums relative z-10">{formatNumber(areaLimits.remainingArea)}<span className="text-sm font-bold opacity-60 ml-1">m²</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left: Form */}
                  <div className="lg:col-span-8 space-y-10">
                    {/* Template Selector */}
                    <div className="pb-8 border-b border-slate-100">
                      <RoomTemplateSelector 
                        propertyId={propertyId} 
                        onSelect={handleTemplateSelect}
                        selectedId={selectedTemplateId}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-tight ml-1">Tên phòng</label>
                        <div className="relative group">
                          <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800"
                            placeholder="e.g. Phòng 101"
                          />
                        </div>
                        {errors.name && <p className="text-xs text-rose-500 font-bold flex items-center gap-1 ml-1"><ShieldAlert className="w-3 h-3"/> {errors.name}</p>}
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-tight ml-1">Mã phòng</label>
                        <div className="relative group">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800"
                            placeholder="P101"
                          />
                        </div>
                        {errors.code && <p className="text-xs text-rose-500 font-bold flex items-center gap-1 ml-1"><ShieldAlert className="w-3 h-3"/> {errors.code}</p>}
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-tight ml-1">Tầng</label>
                        <div className="relative group">
                          <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <select
                            value={formData.floor_id}
                            onChange={e => setFormData({ ...formData, floor_id: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800 appearance-none cursor-pointer"
                          >
                            {!formData.floor_id && (
                              <option value="" disabled>— Chọn tầng —</option>
                            )}
                            {floors.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ArrowRight className="w-4 h-4 rotate-90" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-tight ml-1">Loại phòng</label>
                        <div className="grid grid-cols-2 gap-3">
                          {ROOM_TYPES.map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData({ ...formData, type: t })}
                              className={`py-3 px-2 rounded-2xl border-2 font-black transition-all capitalize text-xs sm:text-xs ${
                                formData.type === t 
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' 
                                  : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-tight ml-1">Diện tích (m²)</label>
                        <div className="relative group">
                          <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            type="text"
                            value={formatNumber(formData.area)}
                            onChange={e => setFormData({ ...formData, area: Number(parseNumber(e.target.value)) })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800"
                          />
                        </div>
                        {errors.area && <p className="text-xs text-rose-500 font-bold flex items-center gap-1 ml-1"><ShieldAlert className="w-3 h-3"/> {errors.area}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-tight ml-1">Sức chứa</label>
                        <div className="relative group">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            type="text"
                            value={formatNumber(formData.capacity)}
                            onChange={e => setFormData({ ...formData, capacity: Number(parseNumber(e.target.value)) })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800"
                          />
                        </div>
                        {errors.capacity && <p className="text-xs text-rose-500 font-bold flex items-center gap-1 ml-1"><ShieldAlert className="w-3 h-3"/> {errors.capacity}</p>}
                      </div>
                      <div className="space-y-3 md:col-span-1">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-tight ml-1">Giá thuê (₫)</label>
                        <div className="relative group">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input
                            type="text"
                            value={formatCurrency(formData.base_price).replace('₫', '').trim()} 
                            onChange={e => setFormData({ ...formData, base_price: Number(parseNumber(e.target.value)) })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-tight ml-1">Ghi chú (Tùy chọn)</label>
                      <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[32px] outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-600 italic"
                        placeholder="Mô tả thêm về phòng..."
                      />
                    </div>
                  </div>

                  {/* Right: Validation Guides */}
                  <div className="lg:col-span-4">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-[32px] p-8 space-y-6 sticky top-4">
                      <div className="flex items-center gap-3 text-indigo-600">
                        <ShieldAlert className="w-5 h-5" />
                        <h3 className="font-black text-sm uppercase tracking-wider">Tiêu chuẩn diện tích</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
                          <p className="text-xs font-bold text-slate-600 leading-relaxed">Diện tích phòng tối thiểu phải đạt <span className="text-indigo-600">10 m²</span>.</p>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-600">Quy định số người ở tối đa:</p>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                { area: '10 - 20 m²', max: '2 người' },
                                { area: '20 - 30 m²', max: '3 người' },
                                { area: '30 - 60 m²', max: '5 người' },
                                { area: 'Trên 60 m²', max: '6 người' },
                              ].map((rule, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-indigo-50/50">
                                  <span className="text-xs font-black text-slate-400 uppercase">{rule.area}</span>
                                  <span className="text-[11px] font-black text-indigo-600 uppercase">{rule.max}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
                          <p className="text-xs font-bold text-slate-600 leading-relaxed">Không cho phép ở quá <span className="text-rose-500 underline decoration-2 underline-offset-2">6 người</span> trong một hợp đồng.</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-indigo-100/50 italic text-xs text-slate-400 font-medium leading-relaxed">
                        * Các tiêu chuẩn trên giúp đảm bảo chất lượng vận hành và an toàn phòng cháy chữa cháy.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {activeStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2 mb-8">
                    <h3 className="text-2xl font-black text-slate-800">Thêm hình ảnh thực tế</h3>
                    <p className="text-slate-500 font-medium">Hình ảnh đẹp giúp khách hàng dễ dàng đưa ra quyết định hơn.</p>
                  </div>
                  <MediaDropzone onDrop={files => setMediaFiles(prev => [...prev, ...files])} maxFiles={10} />
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {mediaFiles.map((file, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Room ${i}`} 
                            className="w-full h-full object-cover"
                          />
                          <button 
                            onClick={() => setMediaFiles(mediaFiles.filter((_, idx) => idx !== i))}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100 mb-8">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800">Dịch vụ áp dụng</h4>
                      <p className="text-sm text-slate-500 font-medium">Chọn các dịch vụ phòng này sẽ sử dụng.</p>
                    </div>
                  </div>
                  <ServicePicker 
                    selectedServiceIds={selectedServices} 
                    onChange={setSelectedServices}
                  />
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800">Danh mục tài sản</h3>
                    <button 
                      onClick={() => setAssets([...assets, { name: '', serial: '', condition: 'good', purchased_at: '', warranty_end: '', note: '' }])}
                      className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-black hover:bg-slate-900 transition-all active:scale-95"
                    >
                      + Thêm tài sản
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                    {assets.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[32px]">
                        <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Chưa có tài sản nào</p>
                      </div>
                    )}
                    {assets.map((asset, i) => {
                      const isExpanded = expandedAssets.has(i);
                      return (
                        <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden group">
                          {/* Row chính: Tên + Tình trạng + Nút mở rộng + Xóa */}
                          <div className="flex gap-3 p-4 items-center">
                            <input 
                              placeholder="Tên tài sản (VD: Điều hòa, Tivi...)"
                              value={asset.name}
                              onChange={e => {
                                const newAssets = [...assets];
                                newAssets[i].name = e.target.value;
                                setAssets(newAssets);
                              }}
                              className="flex-1 bg-white border border-slate-100 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm"
                            />
                            <select
                              value={asset.condition}
                              onChange={e => {
                                const newAssets = [...assets];
                                newAssets[i].condition = e.target.value;
                                setAssets(newAssets);
                              }}
                              className="bg-white border border-slate-100 px-4 py-2.5 rounded-xl outline-none font-black text-xs uppercase w-24"
                            >
                              <option value="new">Mới</option>
                              <option value="good">Tốt</option>
                              <option value="old">Cũ</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedAssets(prev => {
                                  const next = new Set(prev);
                                  if (next.has(i)) next.delete(i); else next.add(i);
                                  return next;
                                });
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                              title="Chi tiết"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                setAssets(assets.filter((_, idx) => idx !== i));
                                setExpandedAssets(prev => { const n = new Set(prev); n.delete(i); return n; });
                              }}
                              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Panel mở rộng: Serial, Ngày mua, Bảo hành, Ghi chú */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-white/60">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                                <div>
                                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                    <Hash className="w-3 h-3" /> Số serial
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="VD: SN-2024-XYZ"
                                    value={asset.serial}
                                    onChange={e => {
                                      const newAssets = [...assets];
                                      newAssets[i].serial = e.target.value;
                                      setAssets(newAssets);
                                    }}
                                    className="w-full bg-white border border-slate-100 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                    <Calendar className="w-3 h-3" /> Ngày mua
                                  </label>
                                  <input
                                    type="date"
                                    value={asset.purchased_at}
                                    onChange={e => {
                                      const newAssets = [...assets];
                                      newAssets[i].purchased_at = e.target.value;
                                      setAssets(newAssets);
                                    }}
                                    className="w-full bg-white border border-slate-100 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                    <Shield className="w-3 h-3" /> Hạn bảo hành
                                  </label>
                                  <input
                                    type="date"
                                    value={asset.warranty_end}
                                    min={asset.purchased_at || undefined}
                                    onChange={e => {
                                      const newAssets = [...assets];
                                      newAssets[i].warranty_end = e.target.value;
                                      setAssets(newAssets);
                                    }}
                                    className="w-full bg-white border border-slate-100 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium"
                                  />
                                </div>
                              </div>
                              <div className="mt-3">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                  <FileText className="w-3 h-3" /> Ghi chú
                                </label>
                                <textarea
                                  placeholder="Ghi chú thêm về tài sản..."
                                  value={asset.note}
                                  onChange={e => {
                                    const newAssets = [...assets];
                                    newAssets[i].note = e.target.value;
                                    setAssets(newAssets);
                                  }}
                                  rows={2}
                                  className="w-full bg-white border border-slate-100 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium resize-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <Activity className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-800">Đồng hồ Điện & Nước</h3>
                    <p className="text-slate-500 font-medium">Khai báo mã đồng hồ và chỉ số chốt đầu tiên cho phòng.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {meters.map((m, i) => (
                      <div key={i} className={`p-8 rounded-[32px] border-2 transition-all ${m.code ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.type === 'ELECTRIC' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Zap className="w-5 h-5" />
                          </div>
                          <span className="font-black uppercase tracking-widest text-sm text-slate-700">
                            Đồng hồ {m.type === 'ELECTRIC' ? 'ĐIỆN' : 'NƯỚC'}
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Mã đồng hồ</label>
                            <input 
                              placeholder="Nhập mã (e.g. D001)"
                              value={m.code}
                              onChange={e => {
                                const newMeters = [...meters];
                                newMeters[i].code = e.target.value;
                                setMeters(newMeters);
                              }}
                              className="w-full bg-white border border-slate-100 px-4 py-3 rounded-2xl outline-none focus:border-indigo-500 font-bold"
                            />
                            {errors[`meter_${i}_code`] && <p className="text-xs text-rose-500 mt-1">{errors[`meter_${i}_code`]}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Chỉ số đầu</label>
                            <input 
                              type="text"
                              value={formatNumber(m.initial_reading)}
                              onChange={e => {
                                const newMeters = [...meters];
                                newMeters[i].initial_reading = Number(parseNumber(e.target.value));
                                setMeters(newMeters);
                              }}
                              className="w-full bg-white border border-slate-100 px-4 py-3 rounded-2xl outline-none focus:border-indigo-500 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-500" />
                      Xác nhận thông tin cuối cùng
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <span className="text-slate-400 block mb-1">Giá thuê:</span>
                        <span className="text-indigo-600 font-black">{formatCurrency(formData.base_price)}</span>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <span className="text-slate-400 block mb-1">Dịch vụ:</span>
                        <span className="text-slate-700 font-black">{selectedServices.length} được chọn</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Footer Actions ─── */}
        <div className="p-8 md:p-12 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <button 
            type="button" 
            onClick={activeStep === 0 ? onCancel : handleBack}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-slate-500 hover:text-slate-800 transition-all uppercase tracking-widest text-xs"
          >
            {activeStep === 0 ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {activeStep === 0 ? 'Hủy bỏ' : 'Quay lại'}
          </button>

          <div className="flex items-center gap-4">
            {activeStep === 0 && (
              <button 
                type="button" 
                onClick={() => handleSubmit(true)}
                disabled={isMutating}
                className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
              >
                Lưu Nháp
              </button>
            )}

            {activeStep < STEPS.length - 1 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Tiếp tục
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={() => handleSubmit(false)}
                disabled={isMutating}
                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50"
              >
                {isMutating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
                Hoàn tất & Công khai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
