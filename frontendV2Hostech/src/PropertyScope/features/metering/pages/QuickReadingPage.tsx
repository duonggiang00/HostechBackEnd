import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, Droplet, ArrowLeft, Save, Send, Loader2, Calendar, TrendingUp, Minus, CheckCircle2, Camera, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { echo } from '@/shared/utils/echo';
import { useMeters, useMeterActions, type Meter } from '../hooks/useMeters';
import { mediaApi } from '@/shared/features/media/api/media';
import MediaDropzone from '@/shared/features/media/components/MediaDropzone';

export default function QuickReadingPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();

  // WebSocket Listener for real-time status updates
  useEffect(() => {
    if (!propertyId || !echo) return;

    echo.private(`property.${propertyId}`)
      .listen('.App.Events.Meter.MeterReadingStatusChanged', (data: any) => {
        toast.success(data.message, {
          duration: 6000,
          position: 'top-right',
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        });
      });

    return () => {
      echo?.leave(`property.${propertyId}`);
    };
  }, [propertyId]);

  // Fetch ALL active meters for the property
  const { meters: metersData, isLoading } = useMeters(propertyId!, {
    filters: { is_active: true },
    perPage: 1000,
    page: 1,
  });

  const meters = (Array.isArray(metersData) ? metersData : []) as Meter[];
  const { bulkCreateReadings } = useMeterActions(propertyId!);

  // Default to this month
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  // State
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [meterMediaFiles, setMeterMediaFiles] = useState<Record<string, File[]>>({});
  const [meterMediaPreviews, setMeterMediaPreviews] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);

  // Grouping meters by Floor -> Room
  const groupedMeters = useMemo(() => {
    if (!meters || meters.length === 0) return {};
    
    const NO_FLOOR = 'Chưa phân tầng';
    const NO_ROOM = 'Chưa xếp phòng';
    const groups: Record<string, Record<string, Meter[]>> = {};

    meters.forEach((meter: Meter) => {
      const room = meter.room;
      const floorName = (room as any)?.floor?.name || NO_FLOOR;
      const roomName = room?.name || NO_ROOM;

      if (!groups[floorName]) groups[floorName] = {};
      if (!groups[floorName][roomName]) groups[floorName][roomName] = [];
      groups[floorName][roomName].push(meter);
    });

    return groups;
  }, [meters]);

  const handleReadingChange = (meterId: string, value: string) => {
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setReadings(prev => ({ ...prev, [meterId]: value }));
  };

  const calculateConsumption = (meter: Meter, newValue: string) => {
    if (!newValue) return 0;
    const prev = meter.latest_reading ?? (typeof meter.last_reading === 'number' ? meter.last_reading : meter.base_reading) ?? 0;
    const current = parseFloat(newValue);
    return Math.max(0, current - prev);
  };

  const handleOpenMediaModal = (meterId: string) => {
    setSelectedMeterId(meterId);
    setShowMediaModal(true);
  };

  const handleMediaDrop = (meterId: string, files: File[]) => {
    setMeterMediaFiles(prev => ({
      ...prev,
      [meterId]: [...(prev[meterId] || []), ...files]
    }));

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMeterMediaPreviews(prev => ({
          ...prev,
          [meterId]: [...(prev[meterId] || []), e.target?.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (meterId: string, index: number) => {
    setMeterMediaFiles(prev => ({
      ...prev,
      [meterId]: (prev[meterId] || []).filter((_, i) => i !== index)
    }));
    setMeterMediaPreviews(prev => ({
      ...prev,
      [meterId]: (prev[meterId] || []).filter((_, i) => i !== index)
    }));
  };

  const uploadAllMedia = async (): Promise<Record<string, string[]>> => {
    const results: Record<string, string[]> = {};
    const metersWithMedia = Object.keys(meterMediaFiles).filter(id => meterMediaFiles[id].length > 0);
    if (metersWithMedia.length === 0) return results;

    setIsUploading(true);
    try {
      for (const mId of metersWithMedia) {
        const files = meterMediaFiles[mId];
        const uploadPromises = files.map(file => mediaApi.uploadFile(file, `meter-readings/${mId}`));
        const uploaded = await Promise.all(uploadPromises);
        results[mId] = uploaded.map(r => r.id);
      }
      return results;
    } catch (err: any) {
      toast.error('Lỗi tải ảnh: ' + (err.message || 'Không xác định'));
      return {};
    } finally {
      setIsUploading(false);
    }
  };

  const buildPayload = () => {
    const payload = Object.entries(readings)
      .map(([meterId, value]) => ({
        meter_id: meterId,
        reading_value: parseFloat(value),
        period_start: periodStart,
        period_end: periodEnd,
      }))
      .filter(item => !isNaN(item.reading_value));

    if (payload.length === 0) {
      toast.error('Vui lòng nhập ít nhất một chỉ số.');
      return null;
    }

    for (const item of payload) {
      const meter = meters.find(m => m.id === item.meter_id);
      const prevReading = meter?.latest_reading ?? (typeof meter?.last_reading === 'number' ? meter?.last_reading : meter?.base_reading) ?? 0;
      if (item.reading_value < prevReading) {
        toast.error(`Chỉ số mới của ${meter?.code} không thể nhỏ hơn số cũ (${prevReading})`);
        return null;
      }
    }
    return payload;
  };

  const handleSave = async () => {
    const payloadBase = buildPayload();
    if (!payloadBase) return;

    try {
      setIsSubmitting(true);
      const mediaMap = await uploadAllMedia();
      const payload = payloadBase.map(item => ({
        ...item,
        status: 'DRAFT',
        ...(mediaMap[item.meter_id] && { proof_media_ids: mediaMap[item.meter_id] })
      }));

      await bulkCreateReadings.mutateAsync(payload);
      toast.success(`Đã lưu nháp ${payload.length} bản ghi.`);
      navigate(`/properties/${propertyId}/meters`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Lỗi khi lưu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndSubmit = async () => {
    const payloadBase = buildPayload();
    if (!payloadBase) return;

    try {
      setIsSubmitting(true);
      const mediaMap = await uploadAllMedia();
      const payload = payloadBase.map(item => ({
        ...item,
        status: 'SUBMITTED',
        ...(mediaMap[item.meter_id] && { proof_media_ids: mediaMap[item.meter_id] })
      }));

      await bulkCreateReadings.mutateAsync(payload);
      toast.success(`Đã lưu & gửi duyệt ${payload.length} bản ghi.`);
      navigate(`/properties/${propertyId}/meters`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Lỗi khi gửi duyệt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMeter = useMemo(() => {
    return selectedMeterId ? meters.find(m => m.id === selectedMeterId) : null;
  }, [selectedMeterId, meters]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6">
        <div>
          <button onClick={() => navigate(`/properties/${propertyId}/meters`)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white mb-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl"><Zap className="w-6 h-6 text-yellow-500" /></div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Chốt số nhanh</h1>
              <p className="text-slate-500 mt-1">Nhập chỉ số hàng loạt cho các phòng</p>
            </div>
          </div>
        </div>
      </div>

      {!isLoading && meters.length > 0 && (
        <div className="sticky top-4 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-bold mb-1.5">
              <span>Tiến độ</span>
              <span className="text-indigo-600" data-testid="reading-progress-text">{Object.keys(readings).length} / {meters.length}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(Object.keys(readings).length / meters.length) * 100}%` }} />
            </div>
          </div>
          <button onClick={handleSave} disabled={isSubmitting || isUploading || Object.keys(readings).length === 0} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50" data-testid="btn-quick-save-draft">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu nháp
          </button>
          <button onClick={handleSaveAndSubmit} disabled={isSubmitting || isUploading || Object.keys(readings).length === 0} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20" data-testid="btn-quick-save-submit">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi duyệt
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Kỳ chốt số</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <input type="date" value={periodStart} data-testid="reading-period-start" onChange={(e) => setPeriodStart(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <input type="date" value={periodEnd} data-testid="reading-period-end" onChange={(e) => setPeriodEnd(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMeters).map(([floor, rooms]) => (
            <div key={floor} className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><div className="w-2 h-6 bg-indigo-500 rounded-full" /> {floor}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(rooms).map(([room, roomMeters]) => (
                  <div key={room} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center"><span className="font-bold text-slate-800 dark:text-slate-200">{room}</span></div>
                    <div className="p-2 space-y-1">
                      {roomMeters.map(meter => {
                        const isElectric = meter.type === 'ELECTRIC';
                        const prev = meter.latest_reading ?? (typeof meter.last_reading === 'number' ? meter.last_reading : meter.base_reading) ?? 0;
                        const current = readings[meter.id] || '';
                        const consumption = calculateConsumption(meter, current);
                        const hasMedia = meterMediaFiles[meter.id]?.length > 0;
                        return (
                          <div key={meter.id} className="flex flex-col sm:flex-row gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors items-start sm:items-center">
                            <div className="flex items-center gap-3 w-32 shrink-0">
                              <div className={`p-2 rounded-lg ${isElectric ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                                {isElectric ? <Zap className="w-4 h-4" /> : <Droplet className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{isElectric ? 'Điện' : 'Nước'}</p>
                                <p className="text-xs font-mono text-slate-500">{meter.code.substring(0, 8)}</p>
                              </div>
                            </div>
                            <div className="flex-1 min-w-[70px]">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cũ</p>
                              <p className="font-bold text-slate-700 dark:text-slate-300" data-testid={`prev-reading-value-${meter.id}`}>{prev.toLocaleString('vi-VN')}</p>
                            </div>
                            <div className="flex-2 min-w-[120px] relative">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mới</p>
                              <div className="relative">
                                <input type="text" inputMode="numeric" value={current} data-testid={`meter-reading-input-${meter.id}`} onChange={(e) => handleReadingChange(meter.id, e.target.value)} className="w-full pl-3 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 font-bold" placeholder="Nhập..." />
                                <button type="button" onClick={() => handleOpenMediaModal(meter.id)} className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${hasMedia ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-500'}`}>
                                  {hasMedia ? <ImageIcon className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="w-24 shrink-0 text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Xài</p>
                              <div className="flex items-center justify-end gap-1">
                                <p className={`font-black text-sm ${consumption > 500 ? 'text-orange-500 animate-pulse' : 'text-indigo-600'}`} data-testid={`consumption-value-${meter.id}`}>{current ? consumption.toLocaleString('vi-VN') : '-'}</p>
                                {current && <div className="p-0.5 rounded-full bg-slate-100">{consumption > 0 ? <TrendingUp className="w-2.5 h-2.5 text-green-600" /> : <Minus className="w-2.5 h-2.5 text-slate-400" />}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showMediaModal && selectedMeter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border dark:border-white/10">
            <div className="px-6 py-4 border-b dark:border-white/5 flex items-center justify-between">
              <div><h3 className="text-lg font-bold">Ảnh minh chứng</h3><p className="text-sm text-slate-500">{selectedMeter.code}</p></div>
              <button onClick={() => setShowMediaModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <MediaDropzone onDrop={(files) => handleMediaDrop(selectedMeter.id, files)} maxFiles={5} />
              {meterMediaPreviews[selectedMeter.id]?.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {meterMediaPreviews[selectedMeter.id].map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border bg-white dark:bg-slate-800">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => handleRemoveMedia(selectedMeter.id, idx)} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 flex justify-end">
              <button onClick={() => setShowMediaModal(false)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20">Xong</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
