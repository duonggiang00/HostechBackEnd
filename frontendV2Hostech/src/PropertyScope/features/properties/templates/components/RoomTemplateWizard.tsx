import { useState, useEffect, useMemo } from 'react';
import { 
  Users, Maximize2, DollarSign, Zap, 
  ShieldAlert, X, Check, Loader2, ArrowRight, ArrowLeft,
  Package, Layout, FileText, Info, Image as ImageIcon, Trash2
} from 'lucide-react';
import { useRoomTemplateActions } from '../hooks/useTemplates';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatNumber, parseNumber } from '@/lib/utils';
import ServicePicker from '@/shared/features/billing/components/ServicePicker';
import MediaDropzone from '@/shared/features/media/components/MediaDropzone';
import { useMediaUpload } from '@/shared/features/media/hooks/useMedia';
import type { RoomTemplate, RoomTemplateImage, CreateRoomTemplatePayload } from '../types';
import { useRooms } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { useFloors } from '@/PropertyScope/hooks/useFloors';
import { useService } from '@/shared/features/billing/hooks/useService';
import type { Service } from '@/shared/features/billing/types';


interface RoomTemplateWizardProps {
  initialData?: RoomTemplate | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyId: string;
}

const STEPS = [
  { id: 'basic', title: 'Thông tin mẫu', icon: Layout },
  { id: 'services', title: 'Dịch vụ', icon: Zap },
  { id: 'assets', title: 'Tài sản', icon: Package },
  { id: 'images', title: 'Hình ảnh', icon: ImageIcon },
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

  const { useServices } = useService();
  const { data: allServicesResponse, isLoading: isLoadingServices } = useServices({ 'filter[is_active]': 1, per_page: 100 });
  const allServices = useMemo(() => Array.isArray(allServicesResponse) ? allServicesResponse : allServicesResponse?.data || [], [allServicesResponse]);

  // Form State
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
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

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const [assets, setAssets] = useState<Array<{ name: string; condition: string; note: string }>>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Media upload state
  const { uploadFile, isUploading } = useMediaUpload();
  const [uploadedImages, setUploadedImages] = useState<RoomTemplateImage[]>([]);
  const [pendingMediaIds, setPendingMediaIds] = useState<string[]>([]);

  // Sync initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        capacity: initialData.capacity || 2,
        area: Number(initialData.area ?? 25),
        base_price: Number(initialData.base_price || 0),
        description: initialData.description || '',
      });
      setSelectedServices(initialData.services?.map((s: any) => typeof s === 'string' ? s : s.id) ?? []);
      setAssets(initialData.assets?.map((a: any) => ({
        name: a.name,
        condition: a.condition || 'new',
        note: a.note || ''
      })) ?? []);
      setUploadedImages(initialData.media?.map(m => ({
        uuid: m.id,
        url: m.original_url,
        thumb_url: m.original_url,
        name: m.name
      })) ?? []);
    }
  }, [initialData]);

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
      
      // Area & Capacity Validation sync with RoomWizard
      if (formData.area < 10) {
        newErrors.area = 'Diện tích tối thiểu phải từ 10 m²';
      }
      
      if (formData.capacity < 1 || formData.capacity > 6) {
        newErrors.capacity = 'Sức chứa phải từ 1 đến 6 người';
      }

      // Capacity to Area scaling rules
      if (formData.capacity >= 3 && formData.capacity <= 4 && formData.area < 18) {
        newErrors.area = 'Sức chứa 3-4 người yêu cầu tối thiểu 18 m²';
      }
      if (formData.capacity >= 5 && formData.capacity <= 6 && formData.area < 25) {
        newErrors.area = 'Sức chứa 5-6 người yêu cầu tối thiểu 25 m²';
      }

      if (formData.base_price <= 0) newErrors.base_price = 'Giá thuê không hợp lệ';
    }

    if (step === 1) {
      if (isLoadingServices) {
        toast.error('Đang tải danh sách dịch vụ, vui lòng đợi...');
        return false;
      }

      const selectedFullServices = allServices.filter((s: Service) => selectedServices.includes(s.id));
      
      // Phân loại dịch vụ dựa trên type hoặc code (fallback)
      const electrics = selectedFullServices.filter((s: Service) => 
        s.type === 'ELECTRIC' || s.code?.toUpperCase().includes('DIEN')
      );
      const waters = selectedFullServices.filter((s: Service) => 
        s.type === 'WATER' || s.code?.toUpperCase().includes('NUOC')
      );

      console.log('RoomTemplateWizard Validation Debug:', {
        selectedIds: selectedServices,
        selectedFullServices,
        electricsFound: electrics.length,
        watersFound: waters.length,
        sampleCodes: selectedFullServices.map((s: Service) => s.code)
      });

      if (electrics.length === 0) {
        toast.error('Vui lòng chọn 1 dịch vụ Điện');
        return false;
      }
      
      if (waters.length === 0) {
        toast.error('Vui lòng chọn 1 dịch vụ Nước');
        return false;
      }

      if (electrics.length > 1) {
        toast.error('Chỉ được phép chọn duy nhất 1 dịch vụ Điện');
        return false;
      }

      if (waters.length > 1) {
        toast.error('Chỉ được phép chọn duy nhất 1 dịch vụ Nước');
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      // Toast handles if step 1 validation fails inside validateStep
    }
  };

  const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0));

  const handleFileDrop = async (files: File[]) => {
    for (const file of files) {
      const response = await uploadFile(file, 'room-templates');
      if (response) {
        setPendingMediaIds(prev => [...prev, response.id]);
        setUploadedImages(prev => [
          ...prev,
          { uuid: response.id, url: response.url, thumb_url: response.url, name: response.name }
        ]);
      }
    }
  };

  const handleRemoveImage = (uuid: string) => {
    setUploadedImages(prev => prev.filter(img => img.uuid !== uuid));
    setPendingMediaIds(prev => prev.filter(id => id !== uuid));
  };

  const handleSubmit = async () => {
    if (!validateStep(0)) {
      setActiveStep(0);
      toast.error('Vui lòng kiểm tra lại thông tin cơ bản');
      return;
    }

    if (!validateStep(1)) {
      setActiveStep(1);
      return;
    }

    const payload: CreateRoomTemplatePayload = {
      ...formData,
      services: selectedServices,
      assets: assets.filter(a => a.name.trim()),
      ...(pendingMediaIds.length > 0 ? { media_ids: pendingMediaIds } : {}),
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
          <div>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-10">
                    <div className="space-y-10">
                      {/* Section: Basic Info */}
                      <section className="bg-white dark:bg-slate-900/60 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
                           <Layout className="w-5 h-5 text-indigo-500" />
                           <h2 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">Thông tin cơ bản</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
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
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border ${errors.capacity ? 'border-rose-500' : 'border-slate-100 dark:border-slate-700'} rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white`}
                              />
                            </div>
                            {errors.capacity && <p className="text-xs text-rose-500 font-bold flex items-center gap-1 ml-1">{errors.capacity}</p>}
                          </div>
                        </div>

                        {/* Area & Capacity Guide */}
                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/40">
                          <div className="flex items-center gap-2 mb-4">
                            <Info className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Tiêu chuẩn diện tích & sức chứa</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className={`p-3 rounded-2xl border transition-all ${formData.capacity <= 2 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                              <p className="text-[10px] font-bold uppercase mb-1">1-2 Người</p>
                              <p className="text-xs font-black">≥ 10 m²</p>
                            </div>
                            <div className={`p-3 rounded-2xl border transition-all ${formData.capacity >= 3 && formData.capacity <= 4 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                              <p className="text-[10px] font-bold uppercase mb-1">3-4 Người</p>
                              <p className="text-xs font-black">≥ 18 m²</p>
                            </div>
                            <div className={`p-3 rounded-2xl border transition-all ${formData.capacity >= 5 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                              <p className="text-[10px] font-bold uppercase mb-1">5-6 Người</p>
                              <p className="text-xs font-black">≥ 25 m²</p>
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


                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-slate-700 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          Cấu hình dịch vụ
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Chọn các dịch vụ sẽ được áp dụng cho mẫu phòng này. (Bắt buộc 1 Điện, 1 Nước)
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedServices(inheritedServiceIds)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 rounded-lg transition-colors border border-brand-100 dark:border-brand-800"
                    >
                      <Check className="w-4 h-4" />
                      Sử dụng dịch vụ mặc định
                    </button>
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
              {/* Step 3 — Images */}
              {activeStep === 3 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-slate-700 mb-8">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white">Hình ảnh mẫu phòng</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ảnh sẽ được tự động kế thừa sang các phòng tạo từ mẫu này.</p>
                    </div>
                  </div>

                  <MediaDropzone
                    onDrop={handleFileDrop}
                    maxFiles={8}
                    accept="image/*"
                    isUploading={isUploading}
                  />

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.map(img => (
                        <div key={img.uuid} className="relative group rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 aspect-square">
                          <img src={img.thumb_url || img.url} alt={img.name} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleRemoveImage(img.uuid)}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadedImages.length === 0 && !isUploading && (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-400 font-medium">Chưa có ảnh nào được thêm. Kéo thả hoặc click để tải lên.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                disabled={activeStep === 1 && !allServicesResponse}
                className="flex items-center gap-2 px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 disabled:opacity-50"
              >
                {activeStep === 1 && !allServicesResponse ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    Tiếp tục
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
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
