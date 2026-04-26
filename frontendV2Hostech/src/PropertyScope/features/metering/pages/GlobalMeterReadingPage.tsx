import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Send, Loader2, Filter,
  Zap, Droplet, RefreshCw, ChevronLeft, ChevronRight,
  FileText, Camera, LayoutList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { meteringApi } from '../api/metering';
import type { MeterReading, MeterReadingStatus } from '../types';
import { ReadingStatusBadge } from '../components/ReadingStatusBadge';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

const formatDate = (s?: string | null) => {
  if (!s) return '-';
  const p = s.split('T')[0].split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'SUBMITTED', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'LOCKED', label: 'Đã khóa' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'ELECTRIC', label: 'Điện' },
  { value: 'WATER', label: 'Nước' },
];

export default function GlobalMeterReadingPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isManager = hasRole(['Manager', 'Owner']);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const perPage = 30;

  // Track selected rows for bulk actions (Manager only)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['global-readings', propertyId, statusFilter, typeFilter, page],
    queryFn: async () => {
      const res = await meteringApi.getGlobalReadings({
        property_id: propertyId,
        status: statusFilter || undefined,
        page,
        per_page: perPage,
        include: 'meter,meter.room,submittedBy,approvedBy',
      });
      return res;
    },
    enabled: !!propertyId,
  });

  const readings: MeterReading[] = useMemo(() => {
    const list: any[] = data?.data ?? [];
    // Client-side filter by meter type (if backend doesn't support it directly)
    if (typeFilter) {
      return list.filter((r: any) => r.meter?.type === typeFilter);
    }
    return list;
  }, [data, typeFilter]);

  const total = data?.meta?.total ?? 0;
  const lastPage = Math.ceil(total / perPage) || 1;

  const submittedReadings = readings.filter((r) => r.status === 'SUBMITTED');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submittedReadings.length && submittedReadings.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submittedReadings.map((r) => r.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkActing(true);
    try {
      await meteringApi.bulkApproveReadings(Array.from(selectedIds));
      toast.success(`Đã duyệt ${selectedIds.size} chốt số`);
      setSelectedIds(new Set());
      refetch();
    } catch {
      toast.error('Có lỗi khi duyệt hàng loạt');
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkReject = async () => {
    if (!rejectReason.trim()) { toast.error('Nhập lý do từ chối'); return; }
    setIsBulkActing(true);
    try {
      await meteringApi.bulkRejectReadings(Array.from(selectedIds), rejectReason);
      toast.success(`Đã từ chối ${selectedIds.size} chốt số`);
      setSelectedIds(new Set());
      setShowRejectModal(false);
      setRejectReason('');
      refetch();
    } catch {
      toast.error('Có lỗi khi từ chối hàng loạt');
    } finally {
      setIsBulkActing(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 max-w-7xl mx-auto px-4">
      {/* Page Header */}
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <LayoutList className="w-7 h-7 text-indigo-500" />
            Lịch sử Chốt số
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Toàn bộ bản ghi chốt số của tài sản
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Làm mới"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[12px] shadow-sm">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedIds(new Set()); }}
          className="px-3 py-2 text-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 rounded-lg font-bold text-gray-700 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50 outline-none transition-all"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 rounded-lg font-bold text-gray-700 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-100 dark:focus:border-blue-500/50 outline-none transition-all"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="ml-auto text-xs text-slate-400 font-medium">
          {total} bản ghi
        </div>
      </div>

      {/* Bulk Action Bar — Manager/Owner only */}
      {isManager && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[12px]">
          <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
            Đã chọn {selectedIds.size} chốt số
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={isBulkActing}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {isBulkActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Duyệt tất cả
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isBulkActing}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-200 dark:border-red-500/30 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Từ chối
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[12px] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-slate-400 font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : readings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-200 dark:text-slate-700" />
            </div>
            <p className="font-bold text-slate-500 dark:text-slate-400">Không có dữ liệu</p>
            <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc để tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800/60">
                  {/* Checkbox col — only show when Manager views SUBMITTED */}
                  {isManager && statusFilter === 'SUBMITTED' && (
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === submittedReadings.length && submittedReadings.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900/50 text-blue-900 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest">Phòng</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest">Loại</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest">Kỳ chốt</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-right">Chỉ số</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-right">Tiêu thụ</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-center">Trạng thái</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest">Người chốt</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-center">Ảnh</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading: any) => {
                  const meter = reading.meter;
                  const room = meter?.room;
                  const unit = meter?.type === 'ELECTRIC' ? 'kWh' : 'm³';
                  const isSelected = selectedIds.has(reading.id);

                  return (
                    <tr
                      key={reading.id}
                      className={`group border-b border-gray-50 dark:border-gray-800/60 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      {isManager && statusFilter === 'SUBMITTED' && (
                        <td className="p-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(reading.id)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900/50 text-blue-900 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="p-4">
                        {room ? (
                          <Link
                            to={`/properties/${propertyId}/meters/room/${room.id}`}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {room.name ?? room.code}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${meter?.type === 'ELECTRIC' ? 'text-yellow-600' : 'text-blue-500'}`}>
                          {meter?.type === 'ELECTRIC' ? <Zap className="w-3.5 h-3.5" /> : <Droplet className="w-3.5 h-3.5" />}
                          {meter?.type === 'ELECTRIC' ? 'Điện' : 'Nước'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{formatDate(reading.period_end)}</span>
                          <span className="text-[10px] text-gray-400">Từ {formatDate(reading.period_start)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                          {(reading.reading_value ?? 0).toLocaleString()}
                        </span>
                        <span className="ml-1 text-[10px] text-gray-400">{unit}</span>
                      </td>
                      <td className="p-4 text-right">
                        {reading.consumption != null ? (
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            +{reading.consumption.toLocaleString()}
                            <span className="text-[10px] text-gray-400 font-normal ml-0.5">{unit}</span>
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <ReadingStatusBadge status={reading.status as MeterReadingStatus} />
                          {reading.status === 'REJECTED' && reading.meta?.rejection_reason && (
                            <p className="text-[10px] text-rose-400 mt-1 max-w-[80px] truncate" title={reading.meta.rejection_reason}>
                              {reading.meta.rejection_reason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {reading.submitted_by?.full_name || 
                           reading.submitted_by?.email ||
                           (reading as any).submittedBy?.full_name || 
                           reading.approved_by?.full_name || 
                           reading.approved_by?.email ||
                           (reading as any).approvedBy?.full_name || 
                           '-'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {reading.proofs && reading.proofs.length > 0 ? (
                          <a
                            href={reading.proofs[0].url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            <Camera className="w-4 h-4" />
                            {reading.proofs.length}
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              Trang {page} / {lastPage} — {total} bản ghi
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1 || isLoading}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= lastPage || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Từ chối {selectedIds.size} chốt số
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Lý do từ chối</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối chung..."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                Hủy
              </button>
              <button
                onClick={handleBulkReject}
                disabled={isBulkActing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {isBulkActing && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
