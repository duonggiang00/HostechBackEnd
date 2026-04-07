import { useState, useMemo, useEffect } from 'react';
import { 
  Home, Tag, Users, Maximize2, DollarSign, FileText, Check, Loader2, 
  Image as ImageIcon, Zap, ShieldAlert, X, FileSignature
} from 'lucide-react';
import { type Room, type CreateRoomPayload, useRoomActions, useRooms } from '@/PropertyScope/features/rooms/hooks/useRooms';
import { usePropertyDetail } from '@/OrgScope/features/properties/hooks/useProperties';
import { useFloorDetail } from '@/PropertyScope/hooks/useFloors';
import { toast } from 'react-hot-toast';
import MediaDropzone from '@/shared/features/media/components/MediaDropzone';
import ServicePicker from '@/shared/features/billing/components/ServicePicker';
import { formatNumber, parseNumber } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { mediaApi } from '@/shared/features/media/api/media';


const roomSchema = z.object({
  name: z.string().min(1, 'Tên phòng không được để trống'),
  code: z.string().min(1, 'Mã phòng không được để trống'),
  capacity: z.number().min(1, 'Sức chứa phải ít nhất là 1'),
  area: z.number().positive('Diện tích phải lớn hơn 0'),
  base_price: z.number().min(0, 'Giá không được âm'),
  description: z.string().optional()
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormProps {
  initialData?: Room | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyId: string;
  floorId?: string | null;
}

export default function RoomForm({ initialData, onSuccess, onCancel, propertyId, floorId }: RoomFormProps) {
  const { createRoom, updateRoom, publishRoom } = useRoomActions();
  const { data: property } = usePropertyDetail(propertyId);
  const { data: floor } = useFloorDetail(floorId || undefined);
  const { data: rooms = [] } = useRooms({ property_id: propertyId, floor_id: floorId || undefined });
  
  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors },
    getValues
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      code: initialData?.code ?? '',
      capacity: initialData?.capacity ?? 2,
      area: initialData?.area ?? 25,
      base_price: initialData?.base_price ?? 0,
      description: initialData?.description ?? '',
    }
  });

  const isEditing = !!initialData?.id;
  const currentArea = watch('area');
  const currentBasePrice = watch('base_price');

  // Related states for complex UI
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialData?.room_services?.map(rs => rs.service?.id).filter(Boolean) as string[] ?? []
  );
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<any[]>(initialData?.images || []);

  // If initialData changes or components mount, handle `code` logic if skipped in zod
  useEffect(() => {
    if (initialData) {
        reset({
          name: initialData.name ?? '',
          code: initialData.code ?? '',
          capacity: initialData.capacity ?? 2,
          area: initialData.area ?? 25,
          base_price: initialData.base_price ?? 0,
          description: initialData.description ?? '',
        });

        if (initialData.room_services) {
            setSelectedServices(initialData.room_services.map(rs => rs.service?.id).filter(Boolean) as string[]);
        }
        if (initialData.images) {
            setExistingMedia(initialData.images);
        }
    }
  }, [initialData, reset]);

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

  const validateCustomRules = (data: RoomFormValues) => {
    let isValid = true;
    const { buildingArea, effectiveLimit, otherRoomsArea, sharedArea, isUsingFloorLimit } = areaLimits;

    // Rule 1: Individual Room Area <= Building Total Area
    if (buildingArea > 0 && data.area > buildingArea) {
      setError('area', { message: `Diện tích vượt quá tổng tòa nhà (${buildingArea} m²)` });
      isValid = false;
    }

    // Rule 2: Sum of rooms on floor <= Floor Area
    if (effectiveLimit > 0) {
      const totalArea = otherRoomsArea + data.area + sharedArea;
      if (totalArea > effectiveLimit) {
        const limitType = isUsingFloorLimit ? 'tầng' : 'tòa nhà';
        setError('area', { message: `Tổng DT (${totalArea} m²) vượt giới hạn ${limitType} (${effectiveLimit} m²). Tính cả ${sharedArea} m² DT chung.` });
        isValid = false;
      }
    } else if (data.area > 500) {
      setError('area', { message: 'Diện tích có vẻ quá lớn (>500 m²)' });
      isValid = false;
    }

    return isValid;
  };

  const [isUploading, setIsUploading] = useState(false);

  const onSubmit = async (data: RoomFormValues) => {
    if (!validateCustomRules(data)) {
      toast.error('Vui lòng sửa các lỗi diện tích trước khi gửi');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload media files if any
      const mediaIds: string[] = [];
      if (mediaFiles.length > 0) {
        toast.loading(`Đang tải lên ${mediaFiles.length} ảnh...`, { id: 'media-upload' });
        const uploadPromises = mediaFiles.map(file => 
          mediaApi.uploadFile(file, `rooms/${propertyId}`)
        );
        const uploadResults = await Promise.all(uploadPromises);
        mediaIds.push(...uploadResults.map(res => res.id));
        toast.success('Tải ảnh lên thành công', { id: 'media-upload' });
      }

      const allMediaIds = [
        ...existingMedia.map(m => m.id).filter(Boolean),
        ...mediaIds
      ];

      const basePayload = {
        ...data,
        base_price: data.base_price > 0 ? data.base_price : undefined,
        property_id: propertyId,
        floor_id: floorId || undefined,
        service_ids: selectedServices,
        media_ids: allMediaIds,
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
              toast.error(err?.response?.data?.message || 'Cập nhật thất bại');
            },
          }
        );
      } else {
        const payload: CreateRoomPayload = {
          ...basePayload,
          code: data.code,
        };
        createRoom.mutate(payload, {
          onSuccess: () => {
            toast.success('Tạo phòng thành công');
            onSuccess?.();
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Tạo phòng thất bại');
          },
        });
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải ảnh lên: ' + (err.message || 'Không xác định'), { id: 'media-upload' });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = () => {
    if (!initialData?.id) return;
    const currentBasePriceValue = getValues('base_price');
    const currentCodeValue = getValues('code');
    publishRoom.mutate(
      {
        id: initialData.id,
        base_price: currentBasePriceValue || undefined,
        code: currentCodeValue || undefined,
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

  const isMutating = createRoom.isPending || updateRoom.isPending || publishRoom.isPending || isUploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
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
                  {...register('name')}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-medium dark:text-white ${
                    errors.name ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500 ring-rose-500/20 shadow-[0_0_0_2px_rgba(244,63,94,0.1)]' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                  placeholder="e.g. Phòng 101"
                />
              </div>
              {errors.name && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/>{errors.name.message}</p>}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Mã phòng</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  {...register('code')}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-medium dark:text-white ${
                    errors.code ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500 ring-rose-500/20 shadow-[0_0_0_2px_rgba(244,63,94,0.1)]' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                  placeholder="P101"
                />
              </div>
              {errors.code && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/>{errors.code.message}</p>}
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
                <Controller
                  name="capacity"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      value={formatNumber(field.value)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        field.onChange(val === '' ? 0 : Number(val));
                      }}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-medium dark:text-white ${
                        errors.capacity ? 'border-rose-300 dark:border-rose-500/50' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
                      }`}
                    />
                  )}
                />
              </div>
              {errors.capacity && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/>{errors.capacity.message}</p>}
            </div>

            {/* Area */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Diện tích (m²)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Maximize2 className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <Controller
                  name="area"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      value={formatNumber(field.value)}
                      onChange={(e) => {
                        const val = parseNumber(e.target.value);
                        field.onChange(val === '' ? 0 : Number(val));
                        clearErrors('area');
                      }}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-medium dark:text-white ${
                        errors.area ? 'border-rose-300 dark:border-rose-500/50' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
                      }`}
                    />
                  )}
                />
              </div>
              {errors.area && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/>{errors.area.message}</p>}
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
                  {currentBasePrice === 0 ? 'Tự động tính' : ''}
                </span>
              </div>
              <Controller
                name="base_price"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    value={field.value === 0 ? '' : formatNumber(field.value)}
                    onChange={(e) => {
                      const val = parseNumber(e.target.value);
                      field.onChange(val === '' ? 0 : Number(val));
                    }}
                    placeholder={property?.default_rent_price_per_m2 ? `Mặc định: ${formatNumber(property.default_rent_price_per_m2)}đ/m²` : "Để trống để tự động tính"}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-emerald-950/10 border rounded-2xl outline-none transition-all font-medium text-lg dark:text-emerald-400 ${
                       field.value === 0 ? 'border-amber-200 dark:border-amber-500/20' : 'border-slate-100 dark:border-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                )}
              />
            </div>
            {currentBasePrice === 0 && property?.default_rent_price_per_m2 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 ml-1 mt-1 font-medium">
                Sẽ được tự động tính: {formatNumber(currentArea * property.default_rent_price_per_m2)}đ (theo {formatNumber(property.default_rent_price_per_m2)}đ/m²)
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Existing Media */}
            {existingMedia.map((img, i) => (
              <div key={`existing-${i}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                     type="button"
                     onClick={() => setExistingMedia(prev => prev.filter((_, idx) => idx !== i))}
                     className="p-2 bg-rose-500 text-white rounded-xl active:scale-95 shadow-lg"
                     title="Xóa ảnh hiện có"
                   >
                     <X className="w-4 h-4" />
                   </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 dark:bg-slate-800/90 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Hiện có
                </div>
              </div>
            ))}

            {/* New Media Files */}
            {mediaFiles.map((file, i) => (
              <div key={`new-${i}`} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-400">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                     type="button"
                     onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))}
                     className="p-2 bg-rose-500 text-white rounded-xl active:scale-95 shadow-lg"
                     title="Xóa ảnh mới chọn"
                   >
                     <X className="w-4 h-4" />
                   </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                  Mới
                </div>
              </div>
            ))}
          </div>

          <MediaDropzone onDrop={(files) => setMediaFiles(prev => [...prev, ...files])} maxFiles={10 - existingMedia.length} />
        </section>

      </div>

      {/* ─── Sidebar (Settings, Rules, Notes, Actions) ─── */}
      <div className="space-y-6">
        

        {/* Rules & Description */}
        <section className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
            <FileSignature className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800 dark:text-white">Mô tả & Quy định</h2>
          </div>

          <textarea
            {...register('description')}
            rows={5}
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
