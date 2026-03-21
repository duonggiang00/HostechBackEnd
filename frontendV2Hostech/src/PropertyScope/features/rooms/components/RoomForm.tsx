import { useState, useMemo } from 'react';
import { 
  Home, Tag, Users, Maximize2, DollarSign, FileText, Check, Loader2, 
  Settings, Image as ImageIcon, Zap, ShieldAlert, X, FileSignature
} from 'lucide-react';
import { type Room, type CreateRoomPayload, useRoomActions, useRooms } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useFloorDetail } from '@/PropertyScope/features/floors/hooks/useFloors';
import { toast } from 'react-hot-toast';
import MediaDropzone from '@/shared/features/media/components/MediaDropzone';
import ServicePicker from '@/shared/features/billing/components/ServicePicker';
import { formatNumber, parseNumber } from '@/lib/utils';

interface RoomFormProps {
  initialData?: Room | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyId: string;
  floorId?: string | null;
}

const ROOM_TYPES = ['standard', 'studio', 'duplex', 'penthouse'] as const;

export default function RoomForm({ initialData, onSuccess, onCancel, propertyId, floorId }: RoomFormProps) {
  const { createRoom, updateRoom, publishRoom } = useRoomActions();
  const { data: property } = usePropertyDetail(propertyId);
  const { data: floor } = useFloorDetail(floorId || undefined);
  const { data: rooms = [] } = useRooms({ property_id: propertyId, floor_id: floorId || undefined });
  
  // Optimized Limit Calculations
  const areaLimits = useMemo(() => {
    const buildingArea = Number(property?.area || 0);
    const floorArea = Number(floor?.area || 0);
    const otherRoomsArea = rooms.reduce((sum, r) => {
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
      isUsingFloorLimit: floorArea > 0
    };
  }, [property, floor, rooms, initialData?.id]);

  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    code: initialData?.code ?? '',
    type: initialData?.type ?? 'standard',
    capacity: initialData?.capacity ?? 2,
    area: initialData?.area ?? 25,
    base_price: initialData?.base_price ?? 0,
    description: initialData?.description ?? '',
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Tên phòng không được để trống';
    if (!isEditing && !formData.code.trim()) newErrors.code = 'Mã phòng không được để trống';
    
    // Basic area checks
    if (formData.area <= 0) newErrors.area = 'Diện tích phải lớn hơn 0';
    
    // Building/Floor Area Validation
    const { buildingArea, effectiveLimit, otherRoomsArea, sharedArea, isUsingFloorLimit } = areaLimits;

    // Rule 1: Individual Room Area <= Building Total Area
    if (buildingArea > 0 && formData.area > buildingArea) {
      newErrors.area = `Diện tích phòng vượt quá tổng diện tích tòa nhà (${buildingArea} m²)`;
    }

    // Rule 2: Sum of rooms on floor <= Floor Area (or Building Area if floor area not defined)
    if (effectiveLimit > 0) {
      const totalArea = otherRoomsArea + formData.area + sharedArea;
      
      if (totalArea > effectiveLimit) {
        const limitType = isUsingFloorLimit ? 'tầng' : 'tòa nhà';
        newErrors.area = `Tổng diện tích sử dụng (${totalArea} m²) vượt quá giới hạn ${limitType} (${effectiveLimit} m²). Bao gồm các phòng và ${sharedArea} m² diện tích chung.`;
      }
    } else if (formData.area > 500) {
      newErrors.area = 'Diện tích có vẻ quá lớn (>500 m²)';
    }

    if (formData.capacity <= 0) newErrors.capacity = 'Sức chứa phải ít nhất là 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateForm()) {
      toast.error('Vui lòng sửa các lỗi trước khi gửi');
      return;
    }

    const basePayload = {
      ...formData,
      base_price: formData.base_price > 0 ? formData.base_price : undefined,
      property_id: propertyId,
      floor_id: floorId || undefined,
    };

    if (isEditing && initialData?.id) {
      updateRoom.mutate(
        { id: initialData.id, ...basePayload },
        {
          onSuccess: () => {
            toast.success('Cập nhật phòng thành công');
            onSuccess?.();
          },
          onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Cập nhật thất bại';
            toast.error(msg);
          },
        }
      );
    } else {
      const payload: CreateRoomPayload = {
        ...basePayload,
        code: formData.code,
        media_ids: [],
      };
      createRoom.mutate(payload, {
        onSuccess: () => {
          toast.success('Tạo phòng thành công');
          if (mediaFiles.length > 0) {
            toast.success(`${mediaFiles.length} tệp phương tiện đã sẵn sàng (tải lên riêng)`);
          }
          onSuccess?.();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Tạo phòng thất bại';
          toast.error(msg);
        },
      });
    }
  };

  const handlePublish = () => {
    if (!initialData?.id) return;
    publishRoom.mutate(
      {
        id: initialData.id,
        base_price: formData.base_price || undefined,
        code: formData.code || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Phòng đã được công khai');
          onSuccess?.();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Công khai thất bại'),
      }
    );
  };

  const isMutating = createRoom.isPending || updateRoom.isPending || publishRoom.isPending;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* ─── Main Content (Basic Info, Media, Pricing) ─── */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Section: Basic Information */}
        <section className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
            <Home className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800 dark:text-white">Thông tin cơ bản</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Tên phòng</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Home className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors(p => ({ ...p, name: '' }));
                  }}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-medium dark:text-white ${
                    errors.name ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500 ring-rose-500/20 shadow-[0_0_0_2px_rgba(244,63,94,0.1)]' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                  placeholder="e.g. Phòng 101"
                />
              </div>
              {errors.name && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/>{errors.name}</p>}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Mã phòng</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({ ...formData, code: e.target.value });
                    if (errors.code) setErrors(p => ({ ...p, code: '' }));
                  }}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-medium dark:text-white ${
                    errors.code ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500 ring-rose-500/20 shadow-[0_0_0_2px_rgba(244,63,94,0.1)]' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                  placeholder="P101"
                />
              </div>
              {errors.code && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/>{errors.code}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capacity */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Sức chứa tối đa</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={formatNumber(formData.capacity)}
                  onChange={(e) => {
                    const val = parseNumber(e.target.value);
                    setFormData({ ...formData, capacity: val === '' ? 0 : Number(val) });
                    if (errors.capacity) setErrors(p => ({ ...p, capacity: '' }));
                  }}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-medium dark:text-white ${
                    errors.capacity ? 'border-rose-300 dark:border-rose-500/50' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {errors.capacity && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/>{errors.capacity}</p>}
            </div>

            {/* Area */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Diện tích (m²)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Maximize2 className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={formatNumber(formData.area)}
                  onChange={(e) => {
                    const val = parseNumber(e.target.value);
                    setFormData({ ...formData, area: val === '' ? 0 : Number(val) });
                    if (errors.area) setErrors(p => ({ ...p, area: '' }));
                  }}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-medium dark:text-white ${
                    errors.area ? 'border-rose-300 dark:border-rose-500/50' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {errors.area && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/>{errors.area}</p>}
            </div>
          </div>
        </section>

        {/* Section: Pricing & Services */}
        <section className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-slate-800 dark:text-white">Giá thuê & Dịch vụ</h2>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Giá thuê hàng tháng (₫)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {formData.base_price === 0 ? 'Tự động tính' : ''}
                </span>
              </div>
              <input
                type="text"
                value={formData.base_price === 0 ? '' : formatNumber(formData.base_price)}
                onChange={(e) => {
                  const val = parseNumber(e.target.value);
                  setFormData({ ...formData, base_price: val === '' ? 0 : Number(val) });
                }}
                placeholder={property?.default_rent_price_per_m2 ? `Mặc định: ${formatNumber(property.default_rent_price_per_m2)}đ/m²` : "Để trống để tự động tính"}
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-emerald-950/10 border rounded-2xl outline-none transition-all font-medium text-lg dark:text-emerald-400 ${
                   formData.base_price === 0 ? 'border-amber-200 dark:border-amber-500/20' : 'border-slate-100 dark:border-emerald-500/20 focus:border-emerald-500'
                }`}
              />
            </div>
            {formData.base_price === 0 && property?.default_rent_price_per_m2 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 ml-1 mt-1 font-medium">
                Sẽ được tự động tính: {formatNumber(formData.area * property.default_rent_price_per_m2)}đ (theo {formatNumber(property.default_rent_price_per_m2)}đ/m²)
              </p>
            )}
          </div>

          <div className="pt-4 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dịch vụ riêng cho phòng</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chọn các dịch vụ có sẵn trong phòng này. Bạn có thể thay đổi giá mặc định của tòa nhà.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2">
              <ServicePicker
                selectedServiceIds={selectedServices}
                onChange={setSelectedServices}
                servicePrices={servicePrices}
                onPriceChange={(id, price) => setServicePrices(prev => ({ ...prev, [id]: price }))}
              />
            </div>
          </div>
        </section>

        {/* Section: Media */}
        <section className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800 dark:text-white">Hình ảnh phòng</h2>
          </div>

          <MediaDropzone onDrop={(files) => setMediaFiles(prev => [...prev, ...files])} maxFiles={10} />

          {mediaFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                Đang chờ tải lên ({mediaFiles.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {mediaFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>

      {/* ─── Sidebar (Settings, Rules, Notes, Actions) ─── */}
      <div className="space-y-6">
        
        {/* Settings & Type */}
        <section className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800 dark:text-white">Cài đặt</h2>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Loại phòng</label>
            <div className="grid grid-cols-2 gap-3">
              {ROOM_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  className={`px-4 py-3 text-sm font-bold rounded-xl transition-all border capitalize ${
                    formData.type === type
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Rules & Description */}
        <section className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
            <FileSignature className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800 dark:text-white">Mô tả & Quy định</h2>
          </div>

          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium resize-none leading-relaxed dark:text-white"
            placeholder="Chi tiết phòng, hướng nhìn, nội thất và các quy định riêng cho phòng này..."
          />
        </section>

        {/* Actions */}
        <div className="space-y-3 sticky top-6">
          <button
            type="submit"
            disabled={isMutating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isMutating ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Check className="w-6 h-6" />
                {isEditing ? 'Lưu thay đổi' : 'Tạo phòng'}
              </>
            )}
          </button>

          {isEditing && initialData?.status === 'draft' && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isMutating}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {publishRoom.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
              Công khai phòng
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-4 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Hủy
          </button>
        </div>

      </div>
    </form>
  );
}
