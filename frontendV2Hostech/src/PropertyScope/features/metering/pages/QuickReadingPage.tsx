import { useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { echo } from '@/shared/utils/echo';
import { useMeters, useMeterActions, type Meter } from '../hooks/useMeters';
import { useBulkSubmitReadings } from '../hooks/useMeters';
import { meteringApi } from '../api/metering';
import { Zap, Droplet, ArrowLeft, Save, AlertCircle, Loader2, Calendar, TrendingUp, TrendingDown, Minus, CheckCircle2, X, Send } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

export default function QuickReadingPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();

  // WebSocket Listener for real-time status updates
  useEffect(() => {
    if (!propertyId || !echo) return;

    console.log('Subscribing to property channel:', `property.${propertyId}`);
    const channel = echo.private(`property.${propertyId}`)
      .listen('.App.Events.Meter.MeterReadingStatusChanged', (data: any) => {
        toast.success(data.message, {
          duration: 6000,
          position: 'top-right',
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        });
      });

    return () => {
      echo.leave(`property.${propertyId}`);
    };
  }, [propertyId]);

  // Fetch ALL active meters for the property (without pagination for quick reading)
  const { meters: metersData, isLoading } = useMeters(propertyId!, {
    filters: { is_active: true },
    perPage: 1000, // Fetch up to 1000 meters at once
    page: 1,
  });

  // Extract array of meters from paginated response
  const meters = (Array.isArray(metersData) ? metersData : metersData) || [] as Meter[];
  const { bulkCreateReadings } = useMeterActions(propertyId!);

  // Default to this month
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  // Keyed by meter ID
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [proofFiles, setProofFiles] = useState<Record<string, File | null>>({});
  const [proofPreviewUrls, setProofPreviewUrls] = useState<Record<string, string>>({});
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const proofInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const proofPreviewUrlsRef = useRef<Record<string, string>>({});

  // Bulk submit flow
  const [savedDraftIds, setSavedDraftIds] = useState<string[]>([]);
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false);
  const bulkSubmitMutation = useBulkSubmitReadings(propertyId);

  useEffect(() => {
    proofPreviewUrlsRef.current = proofPreviewUrls;
  }, [proofPreviewUrls]);

  useEffect(() => {
    return () => {
      Object.values(proofPreviewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const MAX_PROOF_IMAGE_SIZE_MB = 5;
  const MAX_PROOF_IMAGE_SIZE = MAX_PROOF_IMAGE_SIZE_MB * 1024 * 1024;

  const handleProofFileChange = (meterId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const existingPreview = proofPreviewUrls[meterId];

    if (existingPreview) {
      URL.revokeObjectURL(existingPreview);
    }

    if (!file) {
      setProofFiles((prev) => ({ ...prev, [meterId]: null }));
      setProofPreviewUrls((prev) => {
        const next = { ...prev };
        delete next[meterId];
        return next;
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh (jpg, png, webp, ...).');
      event.target.value = '';
      setProofFiles((prev) => ({ ...prev, [meterId]: null }));
      setProofPreviewUrls((prev) => {
        const next = { ...prev };
        delete next[meterId];
        return next;
      });
      return;
    }

    if (file.size > MAX_PROOF_IMAGE_SIZE) {
      toast.error(`Ảnh vượt quá ${MAX_PROOF_IMAGE_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`);
      event.target.value = '';
      setProofFiles((prev) => ({ ...prev, [meterId]: null }));
      setProofPreviewUrls((prev) => {
        const next = { ...prev };
        delete next[meterId];
        return next;
      });
      return;
    }

    setProofFiles((prev) => ({ ...prev, [meterId]: file }));
    setProofPreviewUrls((prev) => ({ ...prev, [meterId]: URL.createObjectURL(file) }));
  };

  const handleRemoveProof = (meterId: string) => {
    const existingPreview = proofPreviewUrls[meterId];
    if (existingPreview) {
      URL.revokeObjectURL(existingPreview);
    }

    setProofFiles((prev) => ({ ...prev, [meterId]: null }));
    setProofPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[meterId];
      return next;
    });

    const inputRef = proofInputRefs.current[meterId];
    if (inputRef) {
      inputRef.value = '';
    }
  };

  // Grouping meters by Floor -> Room with proper sorting
  const groupedMeters = useMemo(() => {
    if (!meters || meters.length === 0) return {};
    
    const NO_FLOOR = 'Chưa phân tầng';
    const NO_ROOM = 'Chưa xếp phòng';

    const groups: Record<string, Record<string, Meter[]>> = {};

    meters.forEach((meter: Meter) => {
      const room = meter.room;
      const floorName = (room as any)?.floor?.name || (room as any)?.floor_name || NO_FLOOR;
      const roomName = room?.name || NO_ROOM;

      if (!groups[floorName]) groups[floorName] = {};
      if (!groups[floorName][roomName]) groups[floorName][roomName] = [];
      
      groups[floorName][roomName].push(meter);
    });

    // Sort floors numerically (1, 2, 3, 4...)
    const sortedFloors: Record<string, Record<string, Meter[]>> = {};
    const floorKeys = Object.keys(groups).sort((a, b) => {
      // Extract numbers from floor names like "Tầng 1", "Tầng 2", etc.
      const aNum = parseInt(a.match(/\d+/)?.[0] || '999');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '999');
      
      // "Chưa phân tầng" (unassigned) goes to the end
      if (isNaN(aNum) || a === NO_FLOOR) return 1;
      if (isNaN(bNum) || b === NO_FLOOR) return -1;
      
      return aNum - bNum;
    });

    floorKeys.forEach(floor => {
      sortedFloors[floor] = groups[floor];
    });

    return sortedFloors;
  }, [meters]);

  const handleReadingChange = (meterId: string, value: string) => {
    // allow numbers and decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setReadings(prev => ({ ...prev, [meterId]: value }));
  };

  const calculateConsumption = (meter: Meter, newValue: string) => {
    if (!newValue) return 0;
    // Use latest_reading from the meter (most recent approved reading)
    const prev = meter.latest_reading ?? (typeof meter.last_reading === 'number' ? meter.last_reading : meter.base_reading) ?? 0;
    const current = parseFloat(newValue);
    return Math.max(0, current - prev);
  };

  const handleSave = async () => {
    // Collect valid readings
    const basePayload = Object.entries(readings)
      .map(([meterId, value]) => ({
        meter_id: meterId,
        reading_value: parseFloat(value as string),
        period_start: periodStart,
        period_end: periodEnd,
      }))
      .filter(item => !isNaN(item.reading_value));

    if (basePayload.length === 0) {
      toast.error('Vui lòng nhập ít nhất một chỉ số để lưu.');
      return;
    }

    // Validation Check: ensure new reading is not smaller than previous
    let hasError = false;
    for (const item of basePayload) {
      const meter = meters.find((m: Meter) => m.id === item.meter_id);
      const prevReading = meter?.last_reading ?? meter?.base_reading ?? 0;
      if (item.reading_value < prevReading) {
        toast.error(`Chỉ số mới của đồng hồ phòng ${meter?.room?.name} (${meter?.code}) không thể nhỏ hơn chỉ số cũ (${prevReading})`);
        hasError = true;
        break;
      }
    }

    if (hasError) return;

    try {
      setIsSubmitting(true);
      const payload = await Promise.all(
        basePayload.map(async (item) => {
          const proof = proofFiles[item.meter_id];
          if (!proof) return item;

          const uploaded = await meteringApi.uploadReadingProof(proof);
          return {
            ...item,
            proof_media_ids: [uploaded.temporary_upload_id],
          };
        }),
      );

      const result = await bulkCreateReadings.mutateAsync(payload);
      // Kiểm tra kết quả trả về: Manager → APPROVED, Staff → DRAFT
      const createdItems = Array.isArray(result) ? result : [];
      const draftIds = createdItems.filter((r: any) => r.status === 'DRAFT').map((r: any) => r.id);

      if (draftIds.length > 0) {
        // Staff flow: có bản nháp → hiện prompt gửi duyệt
        setSavedDraftIds(draftIds);
        toast.success(`Đã lưu ${payload.length} bản nháp thành công.`);
        setShowSubmitPrompt(true);
      } else {
        // Manager flow: tự động APPROVED → chuyển về danh sách
        toast.success(`Đã chốt thành công ${payload.length} chỉ số.`);
        navigate(`/properties/${propertyId}/meters`);
      }
    } catch (error: any) {
      const details = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(', ')
        : null;
      toast.error(details || error?.response?.data?.message || 'Có lỗi xảy ra khi lưu chỉ số.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6">
        <div>
          <button
            onClick={() => navigate(`/properties/${propertyId}/meters`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl">
              <Zap className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Chốt số nhanh</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Nhập chỉ số điện, nước hàng loạt cho các phòng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Floating Bar */}
      {!isLoading && meters.length > 0 && (
        <div className="sticky top-4 z-40 mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-4 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-bold mb-1.5">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Tiến độ chốt số</span>
              <span className="text-indigo-600 dark:text-indigo-400" data-testid="reading-progress-text">{Object.keys(readings).length} / {meters.length} đồng hồ</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                style={{ width: `${(Object.keys(readings).length / meters.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="hidden sm:block h-10 w-px bg-slate-200 dark:bg-white/10 mx-2" />
          <button
            onClick={handleSave}
            disabled={isSubmitting || Object.keys(readings).length === 0}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu ngay
          </button>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Kỳ chốt số
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Từ ngày</label>
              <input
                type="date"
                value={periodStart}
                data-testid="reading-period-start"
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Đến ngày</label>
              <input
                type="date"
                value={periodEnd}
                data-testid="reading-period-end"
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Kỳ chốt số này sẽ được áp dụng cho tất cả các chỉ số bạn nhập bên dưới.
        </p>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : Object.keys(groupedMeters).length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Không tìm thấy đồng hồ nào đang hoạt động.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMeters).map(([floorName, rooms]) => (
            <div key={floorName} className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                {floorName}
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(rooms).map(([roomName, roomMeters]) => (
                  <div key={roomName} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {roomName}
                      </span>
                      {roomMeters.every(m => readings[m.id]) ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Hoàn tất
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {roomMeters.filter(m => readings[m.id]).length}/{roomMeters.length} Đã nhập
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      {roomMeters.map(meter => {
                        const isElectric = meter.type === 'ELECTRIC';
                        const prevValue = meter.latest_reading ?? (typeof meter.last_reading === 'number' ? meter.last_reading : meter.base_reading) ?? 0;
                        const currentValue = readings[meter.id] || '';
                        const consumption = calculateConsumption(meter, currentValue);
                        
                        return (
                          <div key={meter.id} className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors space-y-2">
                            {/* Row 1: Icon, số cũ, input, tiêu thụ */}
                            <div className="flex items-center gap-3">
                              {/* Icon & Meter Code */}
                              <div className="flex items-center gap-2 w-28 shrink-0">
                                <div className={`p-2 rounded-lg shrink-0 ${
                                  isElectric
                                    ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                }`}>
                                  {isElectric ? <Zap className="w-4 h-4" /> : <Droplet className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase leading-none">
                                    {isElectric ? 'Điện' : 'Nước'}
                                  </p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate" title={meter.code}>
                                    {meter.code}
                                  </p>
                                </div>
                              </div>

                              {/* Số cũ */}
                              <div className="w-24 shrink-0">
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Số cũ</p>
                                <p
                                  className="text-sm font-bold text-slate-700 dark:text-slate-300"
                                  data-testid={`prev-reading-value-${meter.id}`}
                                >
                                  {prevValue.toLocaleString('vi-VN')}
                                  <span className="text-[10px] text-slate-400 ml-0.5 font-normal">
                                    {isElectric ? 'kWh' : 'm³'}
                                  </span>
                                </p>
                              </div>

                              {/* Input số mới */}
                              <div className="flex-1 min-w-[110px]">
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Số mới</p>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Nhập số..."
                                  value={currentValue}
                                  data-testid={`meter-reading-input-${meter.id}`}
                                  onChange={(e) => handleReadingChange(meter.id, e.target.value)}
                                  className={`w-full px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-sm text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400
                                    ${currentValue && parseFloat(currentValue) < prevValue
                                      ? 'border-red-300 focus:border-red-500'
                                      : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'}
                                  `}
                                />
                              </div>

                              {/* Tiêu thụ */}
                              <div className="w-28 shrink-0 text-right">
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Tiêu thụ</p>
                                <div className="flex items-center justify-end gap-1.5">
                                  <p
                                    className={`text-sm font-bold ${
                                      consumption > 500
                                        ? 'text-orange-600 animate-pulse'
                                        : consumption > 0
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                    data-testid={`consumption-value-${meter.id}`}
                                  >
                                    {currentValue
                                      ? consumption.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
                                      : '-'}
                                  </p>
                                  {currentValue && (
                                    <div className={`p-0.5 rounded-full ${
                                      consumption > 0
                                        ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                                        : consumption === 0
                                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                                        : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                    }`}>
                                      {consumption > 0 ? <TrendingUp className="w-3 h-3" /> :
                                       consumption === 0 ? <Minus className="w-3 h-3" /> :
                                       <TrendingDown className="w-3 h-3" />}
                                    </div>
                                  )}
                                </div>
                                {consumption > 500 && (
                                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center justify-end gap-0.5 mt-0.5">
                                    <AlertCircle className="w-3 h-3" />
                                    Bất thường!
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Row 2: Upload ảnh chứng minh (full width, compact) */}
                            <div className="flex items-center gap-3 pl-1 border-t border-slate-100 dark:border-slate-700/50 pt-2">
                              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 w-20">
                                Ảnh CM
                              </p>
                              <div className="flex-1 flex items-center gap-2 flex-wrap">
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={(el) => { proofInputRefs.current[meter.id] = el; }}
                                  onChange={(e) => handleProofFileChange(meter.id, e)}
                                  className="text-[11px] text-slate-600 dark:text-slate-300 file:mr-2 file:px-2 file:py-1 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-[11px] dark:file:bg-indigo-500/20 dark:file:text-indigo-300 cursor-pointer"
                                />
                                {proofFiles[meter.id] && proofPreviewUrls[meter.id] && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImageUrl(proofPreviewUrls[meter.id])}
                                      className="h-8 w-8 overflow-hidden rounded border border-slate-200 dark:border-slate-700 shrink-0"
                                      title="Xem ảnh"
                                    >
                                      <img
                                        src={proofPreviewUrls[meter.id]}
                                        alt="Ảnh chứng minh"
                                        className="h-full w-full object-cover"
                                      />
                                    </button>
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 max-w-[140px] truncate" title={proofFiles[meter.id]?.name}>
                                      {proofFiles[meter.id]?.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProof(meter.id)}
                                      className="inline-flex items-center gap-0.5 rounded border border-red-200 dark:border-red-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400 shrink-0"
                                      title="Xóa ảnh"
                                    >
                                      <X className="w-3 h-3" /> Xóa
                                    </button>
                                  </div>
                                )}
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

      {previewImageUrl && (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white hover:text-slate-200"
              onClick={() => setPreviewImageUrl(null)}
              title="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewImageUrl} alt="Ảnh chứng minh" className="w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Submit Prompt Overlay */}
      {showSubmitPrompt && (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Lưu thành công!</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Đã lưu <span className="font-bold text-indigo-600">{savedDraftIds.length}</span> bản nháp.
                Bạn muốn gửi duyệt ngay cho Quản lý?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  if (savedDraftIds.length > 0) {
                    await bulkSubmitMutation.mutateAsync(savedDraftIds);
                  }
                  setShowSubmitPrompt(false);
                  navigate(`/properties/${propertyId}/meters`);
                }}
                disabled={bulkSubmitMutation.isPending}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {bulkSubmitMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Gửi duyệt ngay
              </button>
              <button
                onClick={() => {
                  setShowSubmitPrompt(false);
                  navigate(`/properties/${propertyId}/meters`);
                }}
                className="w-full py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Về danh sách (giữ bản nháp)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
