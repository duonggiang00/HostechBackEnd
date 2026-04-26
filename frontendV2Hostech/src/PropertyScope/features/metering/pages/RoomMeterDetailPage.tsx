import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { 
  ArrowLeft, Loader2, Plus, Zap, Droplet, 
  AlertCircle, X,
  ChevronLeft, ChevronRight, FileText, Settings,
  Send, CheckCircle, XCircle, MessageSquare, Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';
  TableCell 
} from '@/shared/components/ui/table';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { roomsApi } from '@/PropertyScope/features/rooms/api/rooms';
import { meteringApi } from '../api/metering';
import type { Meter, MeterReading } from '../types';
import toast from 'react-hot-toast';
import { ReadingStatusBadge } from '../components/ReadingStatusBadge';
import { MultipleImageUploader, type UploadedProof } from '../components/MultipleImageUploader';
import { AdjustmentNoteDrawer } from '../components/AdjustmentNoteDrawer';

// Skeleton for Header
const HeaderSkeleton = () => (
  <div className="flex items-center gap-4 pt-6">
    <Skeleton className="w-10 h-10 rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

// Skeleton for Column
const ColumnSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-[12px] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
    <div className="p-6 space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  </div>
);

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export default function RoomMeterDetailPage() {
  const { propertyId, roomId } = useParams<{ propertyId: string; roomId: string }>();
  const navigate = useNavigate();

  const { data: room, isLoading: roomLoading, error: roomError } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsApi.getRoom(roomId!, { include: 'meters,meters.latestReading,meters.latestApprovedReading' }),
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000,
  });

  if (roomLoading) {
    return (
      <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
        <HeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ColumnSkeleton />
          <ColumnSkeleton />
        </div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
        <AlertCircle className="w-12 h-12 mb-2" />
        <p>{roomError ? 'Lỗi khi tải thông tin' : 'Phòng không tồn tại'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">Quay lại</button>
      </div>
    );
  }

  // Find master meters
  const eMeters = room.meters?.filter((m: any) => m.type === 'ELECTRIC') || [];
  const wMeters = room.meters?.filter((m: any) => m.type === 'WATER') || [];
  
  const electricMeter = (eMeters.find((m: any) => m.is_master) || eMeters[0] || null) as unknown as Meter;
  const waterMeter = (wMeters.find((m: any) => m.is_master) || wMeters[0] || null) as unknown as Meter;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-4 pt-6">
        <button
          onClick={() => navigate(`/properties/${propertyId}/meters`)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Phòng {room.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Chi tiết chốt số đồng hồ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MeterColumn meter={electricMeter} type="ELECTRIC" />
        <MeterColumn meter={waterMeter} type="WATER" />
      </div>
    </div>
  );
}

interface MeterColumnProps {
  meter: Meter | null;
  type: 'ELECTRIC' | 'WATER';
}

function MeterColumn({ meter, type }: MeterColumnProps) {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isManager = hasRole(['Manager', 'Owner']);
  const [readingsPage, setReadingsPage] = useState(1);
  const perPage = 10;

  // Use useQuery for readings
  const { data: readingsData, isLoading: readingsLoading, refetch } = useQuery({
    queryKey: ['meter-readings', meter?.id, readingsPage],
    queryFn: async () => {
      if (!meter?.id) return { data: [], meta: { total: 0 } };
      const res = await meteringApi.getMeterReadings(meter.id, readingsPage, perPage);
      
      let list: MeterReading[] = [];
      let total = 0;
      
      if (Array.isArray(res)) {
        list = res; 
        total = res.length;
      } else if (res?.data && Array.isArray(res.data)) {
        list = res.data; 
        total = res.meta?.total || list.length;
      }
      
      // Normalize media
      list = list.map(r => ({ ...r, proofs: r.proofs ?? (r as any).media ?? [] }));
      
      return { data: list, meta: { total } };
    },
    enabled: !!meter?.id,
  });

  const readings = readingsData?.data || [];
  const totalReadings = readingsData?.meta?.total || 0;

  // Forms states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ reading_value: '', period_start: '', period_end: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multiple image upload state
  const [proofs, setProofs] = useState<UploadedProof[]>([]);

  // Adjustment note drawer state
  const [adjustmentReading, setAdjustmentReading] = useState<MeterReading | null>(null);

  // Reject modal state
  const [rejectingReading, setRejectingReading] = useState<MeterReading | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const handlePageChange = (newPage: number) => {
    setReadingsPage(newPage);
  };

  const getLastReadingDate = () => {
    if (readings.length === 0) return '';
    const last = readings[0];
    return last.period_end || '';
  };

  const handleOpenAddForm = () => {
    setFormData({ reading_value: '', period_start: getLastReadingDate(), period_end: '' });
    setProofs([]);
    setFormError('');
    setShowAddForm(true);
  };

  const validateForm = () => {
    if (!formData.reading_value) return 'Vui lòng nhập chỉ số';
    if (!formData.period_start) return 'Từ ngày không để trống';
    if (!formData.period_end) return 'Đến ngày không để trống';
    if (new Date(formData.period_start) >= new Date(formData.period_end)) return 'Từ ngày phải nhỏ hơn đến ngày';
    
    const num = parseInt(formData.reading_value);
    if (isNaN(num)) return 'Chỉ số phải là số';
    if (num < 0) return 'Chỉ số không được âm';

    // Monotonic check: Cannot be smaller than latest reading
    const prevValue = meter?.latest_reading ?? meter?.base_reading ?? 0;
    if (num < prevValue) {
      return `Chỉ số mới (${num}) không thể nhỏ hơn chỉ số cũ (${prevValue})`;
    }

    return null;
  };

  const handleSaveReading = async () => {
    if (!meter) return;
    const err = validateForm();
    if (err) { setFormError(err); return; }

    try {
      setIsSubmitting(true);

      await meteringApi.createReading(meter.id, {
        reading_value: parseInt(formData.reading_value),
        period_start: formData.period_start,
        period_end: formData.period_end,
        ...(proofs.length > 0 ? { proof_media_ids: proofs.map(p => p.temporaryId) } : {}),
      });
      toast.success('Thêm chốt số thành công');
      setShowAddForm(false);
      refetch();
    } catch (error: any) {
      setFormError(error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (reading: MeterReading) => {
    try {
      await meteringApi.bulkSubmitReadings([reading.id]);
      toast.success('Đã gửi yêu cầu duyệt');
      refetch();
    } catch {
      toast.error('Có lỗi khi gửi duyệt');
    }
  };

  const handleApprove = async (reading: MeterReading) => {
    try {
      await meteringApi.bulkApproveReadings([reading.id]);
      toast.success('Đã duyệt chốt số');
      refetch();
    } catch {
      toast.error('Có lỗi khi duyệt');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingReading) return;
    if (!rejectReason.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    setIsRejecting(true);
    try {
      await meteringApi.rejectReading(meter!.id, rejectingReading.id, rejectReason);
      toast.success('Đã từ chối chốt số');
      setRejectingReading(null);
      setRejectReason('');
      refetch();
    } catch {
      toast.error('Có lỗi khi từ chối');
    } finally {
      setIsRejecting(false);
    }
  };

  if (!meter) {
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
        {type === 'ELECTRIC' ? <Zap className="w-12 h-12 text-slate-300" /> : <Droplet className="w-12 h-12 text-slate-300" />}
        <p className="mt-4 text-slate-500 font-medium">Chưa định cấu hình Đồng hồ {type === 'ELECTRIC' ? 'Điện' : 'Nước'}</p>
        <Link
          to={`/properties/${propertyId}/templates`}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Cấu hình ngay
        </Link>
      </div>
    );
  }

  const isElectric = type === 'ELECTRIC';
  const Icon = isElectric ? Zap : Droplet;
  const iconColor = isElectric ? 'text-yellow-500' : 'text-blue-500';
  const title = isElectric ? 'Đồng hồ Điện' : 'Đồng hồ Nước';
  const unit = isElectric ? 'kWh' : 'm³';

  return (
    <>
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[12px] shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between bg-gray-50/30 dark:bg-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {title}
                {meter.is_master && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-md">
                    Master
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mã: {meter.code}</p>
            </div>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
            title="Thêm chốt số"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Meter Summary Stats */}
        <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
          <div className="flex gap-6">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chỉ số đầu</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                {meter.base_reading.toLocaleString()} <span className="font-normal opacity-50">{unit}</span>
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chỉ số cuối</p>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                {(meter.latest_reading ?? meter.base_reading).toLocaleString()} <span className="font-normal opacity-50">{unit}</span>
              </p>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lần chốt cuối</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {meter.last_read_at ? formatDate(meter.last_read_at) : 'Chưa có'}
            </p>
          </div>
        </div>

        {/* Add Form Inline */}
        {showAddForm && (
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-indigo-50/30 dark:bg-slate-800/70">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Thêm chốt số mới
              </h3>
              <button 
                onClick={() => { setShowAddForm(false); }}
                className="text-slate-500 hover:bg-slate-200 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{formError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chỉ số mới
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.reading_value}
                      onChange={(e) => setFormData({ ...formData, reading_value: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-lg font-semibold"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{unit}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tiêu thụ dự kiến
                  </label>
                  <div className="h-[46px] flex items-center px-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className={`text-lg font-black ${
                      formData.reading_value && parseInt(formData.reading_value) >= (meter.latest_reading ?? meter.base_reading)
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400'
                    }`}>
                      {formData.reading_value 
                        ? Math.max(0, parseInt(formData.reading_value) - (meter.latest_reading ?? meter.base_reading)).toLocaleString()
                        : '0'
                      }
                    </span>
                    <span className="ml-2 text-xs text-slate-400 font-medium">{unit}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Kỳ chốt từ</label>
                  <input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Multi-image uploader */}
              <MultipleImageUploader
                value={proofs}
                onChange={setProofs}
                maxFiles={5}
              />

              <button
                onClick={handleSaveReading}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu chốt số
              </button>
            </div>
          </div>
        )}

        {/* Readings Table */}
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {readingsLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-400 font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold text-slate-600 dark:text-slate-300">Chưa có lịch sử chốt số</p>
              <p className="text-sm mt-1">Bắt đầu chốt số mới để theo dõi biến động</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800/60">
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest">Kỳ chốt</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-right">Chỉ số ({unit})</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-right">Sử dụng</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-center">Trạng thái</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-center">Ảnh</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-center">Người chốt</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-widest text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => {
                  const hasRejectionReason = reading.status === 'REJECTED' && reading.meta?.rejection_reason;
                  return (
                    <tr
                      key={reading.id}
                      className="group border-b border-gray-50 dark:border-gray-800/60 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {formatDate(reading.period_end)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                            Từ {formatDate(reading.period_start)}
                          </span>
                          {hasRejectionReason && (
                            <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium mt-0.5 max-w-[120px] truncate" title={reading.meta?.rejection_reason}>
                              ↳ {reading.meta?.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                          {reading.reading_value.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {reading.consumption !== undefined ? (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                               +{reading.consumption.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">/{unit}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <ReadingStatusBadge status={reading.status} />
                      </td>
                      <td className="p-4 text-center">
                        {reading.proofs && reading.proofs.length > 0 ? (
                          <div className="flex items-center justify-center">
                            <a
                              href={reading.proofs[0].url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                            >
                              <Camera className="w-4 h-4" />
                              {reading.proofs.length}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                          {reading.submitted_by?.full_name || 
                           reading.submitted_by?.email ||
                           (reading as any).submittedBy?.full_name || 
                           reading.approved_by?.full_name || 
                           reading.approved_by?.email ||
                           (reading as any).approvedBy?.full_name || 
                           '-'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* DRAFT: Staff submits */}
                          {reading.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSubmitForApproval(reading)}
                              title="Gửi duyệt"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {/* SUBMITTED: Manager/Owner approves / rejects only */}
                          {reading.status === 'SUBMITTED' && isManager && (
                            <>
                              <button
                                onClick={() => handleApprove(reading)}
                                title="Duyệt"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setRejectingReading(reading); setRejectReason(''); }}
                                title="Từ chối"
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {/* LOCKED: Adjustment Notes (mọi người đều xem, Manager có thể duyệt) */}
                          {reading.status === 'LOCKED' && (
                            <button
                              onClick={() => setAdjustmentReading(reading)}
                              title="Ghi chú điều chỉnh"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Pagination Footer */}
        {(totalReadings > 10 || readings.length > 0) && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/30 dark:bg-gray-800/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                 Trang {readingsPage} / {Math.ceil(totalReadings / 10) || 1}
               </span>
               <span className="text-[10px] text-gray-300 dark:text-gray-700">•</span>
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                 {totalReadings} kết quả
               </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={readingsPage === 1 || readingsLoading}
                onClick={() => handlePageChange(readingsPage - 1)}
                className="p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={readingsPage >= Math.ceil(totalReadings / 10) || readingsLoading}
                onClick={() => handlePageChange(readingsPage + 1)}
                className="p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Inline Modal */}
      {rejectingReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" onClick={() => setRejectingReading(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Từ chối chốt số
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chỉ số <strong>{rejectingReading.reading_value.toLocaleString()}</strong> {unit} — {formatDate(rejectingReading.period_end)}
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Lý do từ chối</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Ảnh chụp không rõ, số bị nhập sai..."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setRejectingReading(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={isRejecting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Note Drawer */}
      {adjustmentReading && (
        <AdjustmentNoteDrawer
          reading={adjustmentReading}
          isOpen={!!adjustmentReading}
          onClose={() => setAdjustmentReading(null)}
          canManage={isManager}
          unit={unit}
        />
      )}
    </>
  );
}
