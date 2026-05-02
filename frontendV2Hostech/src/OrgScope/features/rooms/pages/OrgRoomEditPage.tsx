import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2,
  Save,
  AlertCircle,
  DoorOpen,
  Hash,
  Ruler,
  Users,
  Layers,
  CircleDollarSign,
  FileText,
  CircleDot,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { useOrgRoom, useUpdateOrgRoom } from '@/OrgScope/features/rooms/hooks/useOrgRooms';
import { useFloors } from '@/PropertyScope/hooks/useFloors';
import type { OrgRoomUpdatePayload, RoomStatus } from '@/OrgScope/features/rooms/types';

const STATUS_OPTIONS: Array<{ value: RoomStatus; label: string }> = [
  { value: 'available', label: 'Sẵn có' },
  { value: 'occupied', label: 'Đã thuê' },
  { value: 'reserved', label: 'Đã đặt' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'draft', label: 'Nháp' },
];

const fieldBase =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white outline-none transition-all placeholder:text-slate-600 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20';
const fieldWithIcon = `${fieldBase} pl-11`;
const labelCls = 'text-sm font-bold text-slate-300 ml-1';
const iconCls = 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4';

export default function OrgRoomEditPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { data: room, isLoading, error } = useOrgRoom(roomId);
  const updateMutation = useUpdateOrgRoom();

  const propertyId = room?.property_id;
  const { data: floors } = useFloors(propertyId);

  const [form, setForm] = useState<OrgRoomUpdatePayload>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!room) return;
    setForm({
      name: room.name,
      code: room.code,
      base_price: Number(room.base_price ?? 0),
      status: room.status as RoomStatus,
      area: Number(room.area ?? 0),
      capacity: Number(room.capacity ?? 0),
      floor_id: room.floor_id ?? null,
      description: room.description ?? '',
    });
  }, [room]);

  const isPublished = useMemo(() => {
    return room ? room.status !== 'draft' : false;
  }, [room]);

  const handleChange = <K extends keyof OrgRoomUpdatePayload>(key: K, value: OrgRoomUpdatePayload[K]) => {
    setTouched(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    try {
      const payload: OrgRoomUpdatePayload = {
        name: form.name,
        base_price: Number(form.base_price ?? 0),
        status: form.status,
        area: Number(form.area ?? 0),
        capacity: Number(form.capacity ?? 0),
        floor_id: form.floor_id || null,
        description: form.description ?? '',
      };
      // Chỉ gửi code khi phòng còn ở trạng thái draft (BE chặn đổi code phòng đã publish).
      if (!isPublished && form.code) {
        payload.code = form.code;
      }
      await updateMutation.mutateAsync({ id: roomId, data: payload });
      navigate('/org/rooms');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Không lưu được phòng';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="m-8 flex flex-col items-center justify-center gap-3 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-12 text-center text-rose-300">
        <AlertCircle className="h-10 w-10" />
        <h3 className="text-lg font-bold">Không tải được dữ liệu phòng</h3>
        <p className="text-sm text-rose-200/80">Phòng có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
        <button
          type="button"
          onClick={() => navigate('/org/rooms')}
          className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const floorOptions = (floors as Array<{ id: string; name: string; floor_number?: number }> | undefined) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <PageBackButton className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-slate-300 hover:bg-white/10" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Chỉnh sửa {room.name}</h1>
          <p className="mt-1 text-slate-500">
            {room.property_name ?? 'Cơ sở chưa rõ'} · Mã{' '}
            <span className="font-bold text-slate-300">{room.code}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
            <DoorOpen className="h-5 w-5 text-emerald-400" />
            <h2 className="font-bold text-white">Thông tin phòng</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className={labelCls}>Tên phòng</label>
              <div className="group relative">
                <div className={iconCls}>
                  <DoorOpen className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <input
                  required
                  type="text"
                  value={form.name ?? ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={fieldWithIcon}
                  placeholder="Phòng 101"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>
                Mã phòng
                {isPublished && (
                  <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-amber-300">
                    (chỉ đọc)
                  </span>
                )}
              </label>
              <div className="group relative">
                <div className={iconCls}>
                  <Hash className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <input
                  type="text"
                  value={form.code ?? ''}
                  onChange={(e) => handleChange('code', e.target.value)}
                  readOnly={isPublished}
                  className={`${fieldWithIcon} ${isPublished ? 'cursor-not-allowed opacity-70' : ''}`}
                  placeholder="RM-101"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Tầng</label>
              <div className="group relative">
                <div className={iconCls}>
                  <Layers className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <select
                  value={form.floor_id ?? ''}
                  onChange={(e) => handleChange('floor_id', e.target.value || null)}
                  className={fieldWithIcon}
                >
                  <option value="">Không gán tầng</option>
                  {floorOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                      {typeof f.floor_number === 'number' ? ` (T${f.floor_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Trạng thái</label>
              <div className="group relative">
                <div className={iconCls}>
                  <CircleDot className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <select
                  value={form.status ?? 'available'}
                  onChange={(e) => handleChange('status', e.target.value as RoomStatus)}
                  className={fieldWithIcon}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Giá thuê (VND/tháng)</label>
              <div className="group relative">
                <div className={iconCls}>
                  <CircleDollarSign className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.base_price ?? 0}
                  onChange={(e) => handleChange('base_price', Number(e.target.value))}
                  className={fieldWithIcon}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Sức chứa (người)</label>
              <div className="group relative">
                <div className={iconCls}>
                  <Users className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <input
                  type="number"
                  min={0}
                  value={form.capacity ?? 0}
                  onChange={(e) => handleChange('capacity', Number(e.target.value))}
                  className={fieldWithIcon}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Diện tích (m²)</label>
              <div className="group relative">
                <div className={iconCls}>
                  <Ruler className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.area ?? 0}
                  onChange={(e) => handleChange('area', Number(e.target.value))}
                  className={fieldWithIcon}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Mô tả</label>
            <div className="group relative">
              <div className="pointer-events-none absolute left-0 top-0 flex items-start pl-4 pt-3">
                <FileText className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
              </div>
              <textarea
                rows={4}
                value={form.description ?? ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`${fieldWithIcon} resize-y`}
                placeholder="Ghi chú vận hành, hướng nhìn, tiện ích đặc biệt..."
              />
            </div>
          </div>
        </section>

        <div className="sticky bottom-0 -mx-2 flex items-center justify-end gap-2 rounded-2xl border border-white/10 bg-[#0d0d0f]/85 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate('/org/rooms')}
            disabled={updateMutation.isPending}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending || !touched}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
