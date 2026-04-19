import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Zap, Droplet, Plus, AlertCircle, X, 
  ChevronLeft, ChevronRight, FileText, Loader2,
  TrendingUp, Calendar
} from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/shared/components/ui/table';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { meteringApi } from '@/PropertyScope/features/metering/api/metering';
import type { MeterReading } from '@/PropertyScope/features/metering/types';
import toast from 'react-hot-toast';

interface RoomUtilityTabProps {
  propertyId: string;
  roomId: string;
  meters?: any[];
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export default function RoomUtilityTab({ propertyId, roomId, meters: initialMeters }: RoomUtilityTabProps) {
  // Use provided meters or fetch them if not available
  const { data: metersData, isLoading: metersLoading } = useQuery({
    queryKey: ['room-meters', roomId],
    queryFn: async () => {
      // In a real scenario, we might need to fetch if initialMeters is incomplete
      // but usually the room detail already has them. 
      // For robustness, we can fetch them specifically for this room.
      const res = await meteringApi.getMeters(propertyId, { room_id: roomId });
      return res.data;
    },
    enabled: !initialMeters,
    initialData: initialMeters,
  });

  const meters = (metersData || []) as any[];
  const electricMeter = meters.find(m => m.type === 'ELECTRIC') || null;
  const waterMeter = meters.find(m => m.type === 'WATER') || null;

  if (metersLoading && !initialMeters) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ColumnSkeleton />
        <ColumnSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MeterColumn meter={electricMeter} type="ELECTRIC" />
      <MeterColumn meter={waterMeter} type="WATER" />
    </div>
  );
}

interface MeterColumnProps {
  meter: any;
  type: 'ELECTRIC' | 'WATER';
}

function MeterColumn({ meter, type }: MeterColumnProps) {
  const [readingsPage, setReadingsPage] = useState(1);
  const perPage = 10;
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);

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
      
      return { data: list, meta: { total } };
    },
    enabled: !!meter?.id,
  });

  const readings = readingsData?.data || [];
  const totalReadings = readingsData?.meta?.total || 0;

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ reading_value: '', period_start: '', period_end: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!proofFile) {
      setPreviewImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setPreviewImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const handleOpenAddForm = () => {
    const lastDate = readings.length > 0 ? readings[0].period_end : '';
    setFormData({ reading_value: '', period_start: lastDate || '', period_end: '' });
    setProofFile(null);
    if (proofInputRef.current) proofInputRef.current.value = '';
    setFormError('');
    setShowAddForm(true);
  };

  const handleSaveReading = async () => {
    if (!meter) return;
    
    // Validation
    if (!formData.reading_value) { setFormError('Vui lòng nhập chỉ số'); return; }
    if (!formData.period_start || !formData.period_end) { setFormError('Vui lòng chọn đầy đủ thời gian'); return; }
    
    const val = parseInt(formData.reading_value);
    const prevVal = (meter.latest_reading ?? meter.last_reading ?? meter.base_reading ?? 0) as number;
    if (val < prevVal) {
      setFormError(`Chỉ số mới (${val}) không thể nhỏ hơn chỉ số cũ (${prevVal})`);
      return;
    }

    try {
      setIsSubmitting(true);
      let mediaIds: string[] = [];
      if (proofFile) {
        const upRes = await meteringApi.uploadReadingProof(proofFile);
        mediaIds = [upRes.temporary_upload_id];
      }

      await meteringApi.createReading(meter.id, {
        reading_value: val,
        period_start: formData.period_start,
        period_end: formData.period_end,
        proof_media_ids: mediaIds,
      });

      toast.success('Thêm chốt số thành công');
      setShowAddForm(false);
      refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!meter) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          {type === 'ELECTRIC' ? <Zap className="w-8 h-8 text-slate-300" /> : <Droplet className="w-8 h-8 text-slate-300" />}
        </div>
        <p className="text-slate-500 font-medium text-sm">Chưa cấu hình đồng hồ {type === 'ELECTRIC' ? 'điện' : 'nước'}</p>
      </div>
    );
  }

  const isE = type === 'ELECTRIC';
  const unit = isE ? 'kWh' : 'm³';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-transparent">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isE ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
            {isE ? <Zap className="w-5 h-5" /> : <Droplet className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white leading-none mb-1">
              {isE ? 'Đồng hồ Điện' : 'Đồng hồ Nước'}
            </h3>
            <p className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-widest">Mã: {meter.code}</p>
          </div>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg transition-all active:scale-95"
          title="Chốt số mới"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/10">
        <div className="flex gap-6">
          <div className="space-y-0.5">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Chỉ số đầu</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
              {meter.base_reading?.toLocaleString()} <span className="font-normal opacity-40">{unit}</span>
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Mới nhất</p>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {(meter.latest_reading ?? meter.last_reading ?? meter.base_reading)?.toLocaleString()} <span className="font-normal opacity-40">{unit}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Chốt cuối</p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Calendar className="w-3 h-3 opacity-40" />
            {formatDate(meter.last_read_at || meter.last_reading_date)}
          </div>
        </div>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <div className="p-5 border-b border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-500/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Ghi chỉ số mới
            </h4>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Chỉ số mới</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.reading_value}
                  onChange={(e) => setFormData({...formData, reading_value: e.target.value})}
                  placeholder="0"
                  className="w-full pl-4 pr-12 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all tabular-nums"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Tiêu thụ ước tính</label>
              <div className="h-[46px] flex items-center px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                <span className={`font-bold text-lg tabular-nums ${formData.reading_value ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {formData.reading_value ? Math.max(0, parseInt(formData.reading_value) - (meter.latest_reading ?? meter.last_reading ?? meter.base_reading)).toLocaleString() : '0'}
                </span>
                <span className="ml-2 text-xs font-bold text-slate-400">{unit}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Từ ngày</label>
              <input 
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Đến ngày</label>
              <input 
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium" 
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[0.7rem] font-bold text-slate-500 uppercase ml-1 flex items-center gap-2 mb-1.5">
              Ảnh minh chứng
              <span className="text-[0.6rem] font-normal lowercase">(Tùy chọn)</span>
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                accept="image/*"
                ref={proofInputRef}
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button 
                onClick={() => proofInputRef.current?.click()}
                className="px-4 py-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {proofFile ? 'Thay đổi ảnh' : 'Chọn ảnh...'}
              </button>
              {previewImageUrl && (
                <div className="relative w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setProofFile(null)}
                    className="absolute top-0 right-0 p-0.5 bg-rose-500 text-white rounded-bl-md"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveReading}
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            Lưu chốt số
          </button>
        </div>
      )}

      {/* Readings Table */}
      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {readingsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Đang tải lịch sử...</p>
          </div>
        ) : readings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700 px-10 text-center">
            <FileText className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-bold text-slate-400">Chưa có lịch sử chốt số</p>
            <p className="text-xs mt-1">Bắt đầu ghi chỉ số mới để theo dõi tiêu thụ.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent bg-slate-50/50 dark:bg-slate-800/10 border-b-0">
                <TableHead className="py-4 font-bold uppercase text-[0.65rem] tracking-widest pl-5">Kỳ chốt</TableHead>
                <TableHead className="py-4 font-bold uppercase text-[0.65rem] tracking-widest text-right">Chỉ số ({unit})</TableHead>
                <TableHead className="py-4 font-bold uppercase text-[0.65rem] tracking-widest text-right">Tiêu thụ</TableHead>
                <TableHead className="py-4 font-bold uppercase text-[0.65rem] tracking-widest text-center pr-5">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((reading) => (
                <TableRow key={reading.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors border-b-0">
                  <TableCell className="py-3 pl-5">
                    <div className="flex items-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatDate(reading.period_end)}
                        </span>
                        <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-tighter">
                          Từ {formatDate(reading.period_start)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                        {reading.reading_value.toLocaleString()}
                      </span>
                      {reading.consumption !== undefined && reading.consumption > 0 && (
                        <span className="text-[0.65rem] text-slate-400 font-bold tabular-nums line-through opacity-50">
                          {(reading.reading_value - reading.consumption).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {reading.consumption !== undefined ? (
                      <div className="flex flex-col items-end leading-none">
                        <span className="text-sm font-bold text-emerald-500 tabular-nums">
                           +{reading.consumption.toLocaleString()}
                        </span>
                        <span className="text-[0.6rem] font-bold text-slate-400 uppercase">{unit}</span>
                      </div>
                    ) : (
                      <span className="text-slate-200">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-center pr-5">
                    <div className="flex justify-center">
                      <StatusBadge status={reading.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ImagePreviewModal 
        url={previewingImage} 
        onClose={() => setPreviewingImage(null)} 
      />

      {/* Pagination Footer */}
      {(totalReadings > perPage || readings.length > 0) && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between">
          <p className="text-[0.65rem] font-bold uppercase text-slate-400 tracking-widest">
            {totalReadings} bản ghi • Trang {readingsPage}/{Math.ceil(totalReadings / perPage) || 1}
          </p>
          <div className="flex items-center gap-1.5">
            <button 
              disabled={readingsPage === 1 || readingsLoading}
              onClick={() => setReadingsPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              disabled={readingsPage >= Math.ceil(totalReadings / perPage) || readingsLoading}
              onClick={() => setReadingsPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    APPROVED: { label: 'Đã duyệt', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    REJECTED: { label: 'Từ chối', class: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' },
    SUBMITTED: { label: 'Chờ duyệt', class: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    PENDING: { label: 'Chờ duyệt', class: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    DRAFT: { label: 'Nháp', class: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400' },
  }[status as keyof typeof cfg] || { label: status, class: 'bg-slate-50 text-slate-500' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

function ImagePreviewModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 max-w-4xl"
          >
            <div className="relative">
              <img 
                src={url} 
                alt="Proof" 
                className="max-h-[85vh] w-auto rounded-2xl shadow-2xl border-4 border-white dark:border-slate-800"
              />
              <button 
                onClick={onClose}
                className="absolute -top-4 -right-4 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full shadow-xl hover:scale-110 transition-transform z-20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ColumnSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-[500px] flex flex-col">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
      </div>
    </div>
  );
}
