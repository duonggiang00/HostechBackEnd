import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMeterActions, type Meter } from '../hooks/useMeters';
import { roomsApi } from '../../rooms/api/rooms';
import type { Room } from '../../rooms/types';

interface MeterFormModalProps {
  meter?: Meter | null;
  onClose: () => void;
  propertyId: string;
}

export default function MeterFormModal({ meter, onClose, propertyId }: MeterFormModalProps) {
  const isEditing = !!meter;

  const [code, setCode] = useState(meter?.code || '');
  const [type, setType] = useState<'ELECTRIC' | 'WATER'>(meter?.type || 'ELECTRIC');
  const [roomId, setRoomId] = useState(meter?.room_id || '');
  const [isMaster, setIsMaster] = useState(meter?.is_master || false);
  const [isActive, setIsActive] = useState(meter?.is_active ?? true);
  const [baseReading, setBaseReading] = useState(meter?.base_reading?.toString() || '');
  const [installedAt, setInstalledAt] = useState(meter?.installed_at?.split('T')[0] || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const { createMeter, isCreating, updateMeter, isUpdating } = useMeterActions(propertyId);

  // Update form when meter changes (fix for editing existing meter)
  useEffect(() => {
    if (meter) {
      setCode(meter.code || '');
      setType(meter.type || 'ELECTRIC');
      setRoomId(meter.room_id || '');
      setIsMaster(meter.is_master || false);
      setIsActive(meter.is_active ?? true);
      setBaseReading(meter.base_reading?.toString() || '');
      setInstalledAt(meter.installed_at?.split('T')[0] || '');
      setErrors({});
    }
  }, [meter]);

  // Fetch rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const data = await roomsApi.getRooms({
          property_id: propertyId,
          per_page: 100,
        });
        console.log('📦 Rooms from API:', data);
        
        // Data should already be Room[] from roomsApi
        const roomsList: Room[] = Array.isArray(data) ? data : [];
        
        // Sort rooms by code
        const sortedRooms = roomsList.sort((a, b) => {
          return `${a.code}`.localeCompare(`${b.code}`);
        });
        
        console.log('🏠 Sorted Rooms:', sortedRooms);
        setRooms(sortedRooms);
      } catch (error) {
        console.error('❌ Failed to fetch rooms:', error);
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    if (propertyId) {
      fetchRooms();
    }
  }, [propertyId]);

  const handleValidate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Mã đồng hồ là bắt buộc';
    }

    if (!type) {
      newErrors.type = 'Loại đồng hồ là bắt buộc';
    }

    if (baseReading && isNaN(parseFloat(baseReading))) {
      newErrors.baseReading = 'Chỉ số cơ sở phải là số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handleValidate()) {
      return;
    }

    setIsSubmitting(true);

    const data: Partial<Meter> = {
      code: code.trim(),
      type,
      is_active: isActive,
      is_master: isMaster,
      ...(roomId && { room_id: roomId }),
      ...(baseReading && { base_reading: parseFloat(baseReading) }),
      ...(installedAt && { installed_at: installedAt }),
      property_id: propertyId,
    };

    try {
      if (isEditing) {
        updateMeter({ meterId: meter!.id, data });
      } else {
        createMeter(data);
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-black/50 border border-transparent dark:border-white/10 max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Sửa đồng hồ' : 'Thêm đồng hồ mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Code */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Mã đồng hồ <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (errors.code) setErrors({ ...errors, code: '' });
              }}
              placeholder="e.g., DH001, DH-001"
              className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                errors.code 
                  ? 'border-red-500 dark:border-red-500/70 focus:ring-red-100 dark:focus:ring-red-500/10' 
                  : 'border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-500/10'
              }`}
            />
            {errors.code && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.code}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Loại đồng hồ <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as 'ELECTRIC' | 'WATER');
                if (errors.type) setErrors({ ...errors, type: '' });
              }}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                errors.type 
                  ? 'border-red-500 dark:border-red-500/70 focus:ring-red-100 dark:focus:ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-500/10'
              }`}
            >
              <option value="">Chọn loại</option>
              <option value="ELECTRIC">Điện</option>
              <option value="WATER">Nước</option>
            </select>
            {errors.type && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.type}</p>}
          </div>

          {/* Room (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Phòng <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">(tùy chọn)</span>
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={loadingRooms}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:opacity-50"
            >
              <option value="">
                {loadingRooms ? 'Đang tải phòng...' : 'Không gán phòng'}
              </option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.code} - {room.name}
                </option>
              ))}
            </select>
            {rooms.length === 0 && !loadingRooms && (
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Không có phòng nào</p>
            )}
          </div>

          {/* Base Reading */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Chỉ số cơ sở <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">(tùy chọn)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={baseReading}
              onChange={(e) => {
                setBaseReading(e.target.value);
                if (errors.baseReading) setErrors({ ...errors, baseReading: '' });
              }}
              placeholder="0.00"
              className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                errors.baseReading 
                  ? 'border-red-500 dark:border-red-500/70 focus:ring-red-100 dark:focus:ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-500/10'
              }`}
            />
            {errors.baseReading && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.baseReading}</p>
            )}
          </div>

          {/* Installed At */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Ngày cài đặt <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">(tùy chọn)</span>
            </label>
            <input
              type="date"
              value={installedAt}
              onChange={(e) => setInstalledAt(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-white/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isMaster}
                onChange={(e) => setIsMaster(e.target.checked)}
                className="w-5 h-5 border border-slate-300 dark:border-slate-600 rounded text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Đồng hồ Master
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                  Đồng hồ chính dùng để tính mức tiêu thụ tổng
                </p>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 border border-slate-300 dark:border-slate-600 rounded text-green-600 focus:ring-2 focus:ring-green-500 dark:bg-slate-700"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Hoạt động
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                  Đồng hồ này đang được sử dụng
                </p>
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCreating || isUpdating}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || isCreating || isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                isEditing ? 'Cập nhật' : 'Tạo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
