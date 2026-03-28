import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { echo } from '@/shared/utils/echo';
import { useMeters, useMeterActions, type Meter } from '../hooks/useMeters';
import { Zap, Droplet, ArrowLeft, Save, AlertCircle, Loader2, Calendar, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const payload = Object.entries(readings)
      .map(([meterId, value]) => ({
        meter_id: meterId,
        reading_value: parseFloat(value as string),
        period_start: periodStart,
        period_end: periodEnd,
      }))
      .filter(item => !isNaN(item.reading_value));

    if (payload.length === 0) {
      toast.error('Vui lòng nhập ít nhất một chỉ số để lưu.');
      return;
    }

    // Validation Check: ensure new reading is not smaller than previous
    let hasError = false;
    for (const item of payload) {
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
      await bulkCreateReadings.mutateAsync(payload);
      toast.success(`Đã chốt thành công ${payload.length} chỉ số.`);
      navigate(`/properties/${propertyId}/meters`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu chỉ số.');
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
                max={format(new Date(), 'yyyy-MM-dd')}
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
                max={format(new Date(), 'yyyy-MM-dd')}
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
                          <div key={meter.id} className="flex flex-col sm:flex-row gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors items-start sm:items-center">
                            {/* Icon & Details */}
                            <div className="flex items-center gap-3 w-32 shrink-0">
                              <div className={`p-2 rounded-lg ${
                                isElectric ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              }`}>
                                {isElectric ? <Zap className="w-4 h-4" /> : <Droplet className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{isElectric ? 'Điện' : 'Nước'}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5" title={meter.code}>{meter.code.substring(0, 8)}</p>
                              </div>
                            </div>

                            {/* Old Reading */}
                            <div className="flex-1 min-w-[100px]">
                              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Số cũ</p>
                              <p 
                                className="font-semibold text-slate-700 dark:text-slate-300"
                                data-testid={`prev-reading-value-${meter.id}`}
                              >
                                {prevValue.toLocaleString('vi-VN')}
                                <span className="text-xs text-slate-400 ml-1 font-normal">{isElectric ? 'kWh' : 'm³'}</span>
                              </p>
                            </div>

                            {/* Input New Reading */}
                            <div className="flex-2">
                              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Số mới</p>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Nhập số mới..."
                                value={currentValue}
                                data-testid={`meter-reading-input-${meter.id}`}
                                onChange={(e) => handleReadingChange(meter.id, e.target.value)}
                                className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400
                                  ${currentValue && parseInt(currentValue, 10) < prevValue ? 'border-red-300 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'}
                                `}
                              />
                            </div>

                            {/* Consumption & Trend */}
                            <div className="w-32 shrink-0 text-right">
                              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Tiêu thụ</p>
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center justify-end gap-2">
                                  <p 
                                    className={`font-bold ${consumption > 500 ? 'text-orange-600 animate-pulse' : consumption > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
                                    data-testid={`consumption-value-${meter.id}`}
                                  >
                                    {currentValue ? consumption.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 3 }) : '-'}
                                  </p>
                                  {currentValue && (
                                    <div className={`p-1 rounded-full ${
                                      consumption > 0 ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 
                                      consumption === 0 ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500' :
                                      'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                    }`}>
                                      {consumption > 0 ? <TrendingUp className="w-3 h-3" /> : 
                                       consumption === 0 ? <Minus className="w-3 h-3" /> : 
                                       <TrendingDown className="w-3 h-3" />}
                                    </div>
                                  )}
                                </div>
                                {consumption > 500 && (
                                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Bất thường!
                                  </span>
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
    </div>
  );
}
