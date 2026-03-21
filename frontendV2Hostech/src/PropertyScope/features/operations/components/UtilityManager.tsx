import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Droplets, Camera, History, 
  Check, X, AlertCircle, RefreshCcw, TrendingUp
} from 'lucide-react';
import { useMeters, useMeterReadings, type Meter, type MeterReading } from '@/PropertyScope/features/metering/hooks/useMeters';
import MeterHistoryModal from '@/PropertyScope/features/metering/components/MeterHistoryModal';
import type { RoomMeter } from '@/PropertyScope/features/rooms/types';

interface UtilityManagerProps {
  propertyId: string;
  roomId?: string | null;
  data?: RoomMeter[];
  isLoading?: boolean;
}

export default function UtilityManager({ propertyId, roomId, data }: UtilityManagerProps) {
  const { meters: fetchedMeters, isLoading: metersLoading } = useMeters(propertyId, {
    enabled: !data
  });
  
  const meters = (data as any as Meter[]) || fetchedMeters;

  const roomMeters = roomId ? meters.filter(m => m.room_id === roomId) : meters;
  const activeMeterId = roomMeters[0]?.id;
  const { readings, isLoading: readingsLoading } = useMeterReadings(activeMeterId);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [historyMeter, setHistoryMeter] = useState<Meter | null>(null);

  if (metersLoading || readingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCcw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {roomMeters.slice(0, 4).map((meter) => (
          <div key={meter.id} className={`p-5 rounded-3xl text-white shadow-xl relative overflow-hidden group transition-all hover:scale-[1.02] ${
            meter.type === 'ELECTRIC' ? 'bg-linear-to-br from-indigo-600 to-indigo-700 shadow-indigo-100' : 'bg-linear-to-br from-cyan-500 to-cyan-600 shadow-cyan-100'
          }`}>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              {meter.type === 'ELECTRIC' ? <Zap className="w-16 h-16" /> : <Droplets className="w-16 h-16" />}
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-black uppercase tracking-widest opacity-70">
                  {meter.type === 'ELECTRIC' ? 'Electric' : 'Water'} Meter
                </p>
                <div className="px-1.5 py-0.5 bg-white/20 rounded-md text-[8px] font-black uppercase tracking-tighter">
                  {meter.code}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-black">{meter.last_reading || '0'}</h3>
                <span className="text-sm font-bold opacity-60">{meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-black uppercase bg-white/10 w-fit px-2 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3" />
                Latest: {meter.last_reading_date || 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recent Readings</h4>
        <button 
          onClick={() => setIsCapturing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          New Reading
        </button>
      </div>

      <div className="space-y-3">
        {readings.map((reading: MeterReading) => {
          const meter = meters.find(m => m.id === reading.meter_id);
          return (
            <div key={reading.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl flex items-center gap-4 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all group">
              <div className={`p-2.5 rounded-2xl ${meter?.type === 'ELECTRIC' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'}`}>
                {meter?.type === 'ELECTRIC' ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-black text-slate-900 dark:text-white text-sm">{reading.reading_value} {meter?.type === 'ELECTRIC' ? 'kWh' : 'm³'}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                    reading.status === 'APPROVED' ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
                  }`}>
                    {reading.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{reading.reading_date} • {reading.consumption || '0'} unit increase</p>
              </div>

              <button 
                onClick={() => meter && setHistoryMeter(meter)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-all"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {isCapturing && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCapturing(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-5xl shadow-2xl w-full max-w-xl overflow-hidden relative border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">OCR Meter Reading</h3>
                      <p className="text-xs text-slate-500 font-medium">Automatic extraction from photo</p>
                    </div>
                  </div>
                  <button onClick={() => setIsCapturing(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="aspect-4/3 bg-slate-100 dark:bg-slate-800/80 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-2 overflow-hidden relative">
                    {/* Simulated Camera Viewfinder */}
                    <div className="absolute inset-4 border-2 border-indigo-500/30 rounded-2xl" />
                    <Camera className="w-10 h-10 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Awaiting Capture</p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center items-center text-center">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detected Value</p>
                      <div className="relative group">
                        <h4 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">—</h4>
                        <div className="absolute -top-1 -right-4 animate-pulse">
                          <RefreshCcw className="w-4 h-4 text-indigo-300 dark:text-indigo-500" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 font-bold uppercase">Confidence: 0%</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-amber-50 dark:bg-amber-500/10 rounded-3xl border border-amber-100 dark:border-amber-500/20 mb-8">
                  <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed italic">
                    "Please ensure the digits are clearly visible and centered within the blue frame for highest accuracy."
                  </p>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
                    Discard
                  </button>
                  <button className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Confirm & Save
                  </button>
                </div>
              </div>
              <div className="h-2 bg-slate-50 dark:bg-slate-800" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {historyMeter && (
        <MeterHistoryModal meter={historyMeter} onClose={() => setHistoryMeter(null)} />
      )}
    </div>
  );
}
