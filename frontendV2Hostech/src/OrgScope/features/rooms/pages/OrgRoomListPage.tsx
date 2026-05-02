import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Loader2,
  DoorOpen,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useOrgRooms, useDeleteOrgRoom } from '@/OrgScope/features/rooms/hooks/useOrgRooms';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';
import type { OrgRoomListItem, RoomStatus } from '@/OrgScope/features/rooms/types';

const STATUS_LABELS: Record<RoomStatus, string> = {
  available: 'Sẵn có',
  occupied: 'Đã thuê',
  maintenance: 'Bảo trì',
  reserved: 'Đã đặt',
  draft: 'Nháp',
};

const STATUS_STYLES: Record<RoomStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  occupied: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  maintenance: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  reserved: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  draft: 'bg-white/10 text-slate-400 border-white/15',
};

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

type SortKey = 'name' | 'base_price';

export default function OrgRoomListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = useAuthStore((s) => s.hasRole(['Admin', 'Owner', 'Manager']));

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [status, setStatus] = useState<RoomStatus | ''>(
    (searchParams.get('status') as RoomStatus) ?? '',
  );
  const [propertyId, setPropertyId] = useState<string>(searchParams.get('property_id') ?? '');
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [sortKey, setSortKey] = useState<SortKey | null>(
    (searchParams.get('sort_key') as SortKey) || null,
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(
    (searchParams.get('sort_dir') as 'asc' | 'desc') || 'asc',
  );

  const sortParam = useMemo(() => {
    if (!sortKey) return undefined;
    return sortDir === 'desc' ? `-${sortKey}` : sortKey;
  }, [sortKey, sortDir]);

  // Reset page khi đổi search/filter (giữ trải nghiệm trực quan)
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, propertyId]);

  // Sync URL
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch) next.set('search', debouncedSearch);
    if (status) next.set('status', status);
    if (propertyId) next.set('property_id', propertyId);
    if (page > 1) next.set('page', String(page));
    if (sortKey) {
      next.set('sort_key', sortKey);
      next.set('sort_dir', sortDir);
    }
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, status, propertyId, page, sortKey, sortDir, setSearchParams]);

  const { data, isLoading, isFetching, error } = useOrgRooms({
    search: debouncedSearch || undefined,
    status: status || undefined,
    property_id: propertyId || undefined,
    page,
    per_page: 15,
    sort: sortParam,
  });

  // Properties dropdown — Owner thấy toàn org; Manager/Staff sẽ tự bị scope.
  const { data: properties } = useProperties({ 'filter[org_id]': user?.org_id });

  const deleteMutation = useDeleteOrgRoom();
  const [confirmingDelete, setConfirmingDelete] = useState<OrgRoomListItem | null>(null);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 inline h-3 w-3 text-emerald-400" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3 text-emerald-400" />
    );
  };

  const handleConfirmDelete = async () => {
    if (!confirmingDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmingDelete.id);
      setConfirmingDelete(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Không xóa được phòng';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Danh sách phòng</h1>
          <p className="mt-1 text-slate-500">
            Toàn bộ phòng trong tổ chức — tìm kiếm, lọc, chỉnh sửa và xóa nhanh.
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã phòng..."
            className="w-full border-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-white"
              aria-label="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/40"
        >
          <option value="">Tất cả cơ sở</option>
          {(properties as Array<{ id: string; name: string }> | undefined)?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RoomStatus | '')}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/40"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Sẵn có</option>
          <option value="occupied">Đã thuê</option>
          <option value="reserved">Đã đặt</option>
          <option value="maintenance">Bảo trì</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="cursor-pointer select-none px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-300"
                >
                  Tên phòng {renderSortIcon('name')}
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">
                  Tòa nhà
                </th>
                <th
                  onClick={() => toggleSort('base_price')}
                  className="cursor-pointer select-none px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-300"
                >
                  Giá thuê {renderSortIcon('base_price')}
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">
                  Người thuê chính
                </th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-rose-400">
                    Không tải được danh sách phòng. Vui lòng thử lại.
                  </td>
                </tr>
              ) : isLoading && rows.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="h-4 w-44 rounded bg-white/10" />
                      <div className="mt-2 h-3 w-28 rounded bg-white/5" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-32 rounded bg-white/10" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="ml-auto h-4 w-20 rounded bg-white/10" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-5 w-20 rounded-full bg-white/10" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-32 rounded bg-white/10" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="ml-auto h-8 w-20 rounded bg-white/10" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    {debouncedSearch || status || propertyId
                      ? 'Không có phòng nào khớp tiêu chí lọc.'
                      : 'Chưa có phòng nào.'}
                  </td>
                </tr>
              ) : (
                rows.map((room) => {
                  const tenant = room.primary_tenant?.full_name?.trim();
                  return (
                    <tr key={room.id} className="group transition-colors hover:bg-white/[0.04]">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-colors group-hover:bg-emerald-500/25">
                            <DoorOpen className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">{room.name}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              <span className="font-bold uppercase tracking-wider text-slate-400">
                                {room.code}
                              </span>
                              {room.area ? <span> · {room.area} m²</span> : null}
                              {room.capacity ? <span> · {room.capacity} người</span> : null}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">
                          {room.property_name ?? '—'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {room.floor_name ? `Tầng ${room.floor_name}` : 'Không rõ tầng'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-emerald-400">
                          {formatVnd(room.base_price ?? 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_STYLES[room.status as RoomStatus] ?? STATUS_STYLES.draft
                          }`}
                        >
                          {STATUS_LABELS[room.status as RoomStatus] ?? room.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tenant ? (
                          <div>
                            <p className="text-sm font-medium text-white">{tenant}</p>
                            {room.primary_tenant?.phone ? (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {room.primary_tenant.phone}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/org/rooms/${room.id}/edit`)}
                            disabled={!canManage}
                            title={canManage ? 'Sửa phòng' : 'Bạn không có quyền sửa'}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(room)}
                            disabled={!canManage}
                            title={canManage ? 'Xóa phòng' : 'Bạn không có quyền xóa'}
                            className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4 md:flex-row">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {meta
              ? `Trang ${meta.current_page} / ${meta.last_page} · Tổng ${meta.total} phòng`
              : 'Đang tải...'}
            {isFetching && rows.length > 0 ? (
              <Loader2 className="ml-2 inline h-3 w-3 animate-spin text-emerald-400" />
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta || meta.current_page <= 1}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Trang trước
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => (meta && p < meta.last_page ? p + 1 : p))}
              disabled={!meta || meta.current_page >= meta.last_page}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trang sau
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0B]/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Xác nhận xóa phòng</h2>
            <p className="mt-2 text-sm text-slate-400">
              Bạn có chắc muốn xóa phòng{' '}
              <span className="font-bold text-white">{confirmingDelete.name}</span>{' '}
              <span className="text-slate-500">({confirmingDelete.code})</span>? Hành động này có thể
              được khôi phục từ thùng rác.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(null)}
                disabled={deleteMutation.isPending}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400 disabled:opacity-60"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Xóa phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
