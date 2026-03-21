// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Activity, CalendarDays, Droplets, Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import { useMeterHistory, type Meter } from '@/PropertyScope/features/metering/hooks/useMeters';

interface MeterHistoryModalProps {
  meter: Meter;
  onClose: () => void;
}

export default function MeterHistoryModal({ meter, onClose }: MeterHistoryModalProps) {
  const [months, setMonths] = useState(6);
  const { data: history, isLoading } = useMeterHistory(meter.id, months);

  const isElectric = meter.type === 'ELECTRIC';
  const unit = isElectric ? 'kWh' : 'm³';
  const themeColor = isElectric ? '#4f46e5' : '#06b6d4';
  const themeBg = isElectric ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-cyan-50 dark:bg-cyan-500/10';
  const themeText = isElectric ? 'text-indigo-600 dark:text-indigo-400' : 'text-cyan-600 dark:text-cyan-400';

  // Format data for chart (reverse so oldest is first)
  const chartData = history ? [...history].reverse().map(reading => ({
    date: new Date(reading.reading_date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    reading: reading.reading_value,
    consumption: reading.consumption || 0,
    fullDate: reading.reading_date
  })) : [];

  const avgConsumption = chartData.length > 0 
    ? Math.round(chartData.reduce((acc, curr) => acc + curr.consumption, 0) / chartData.length) 
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${themeBg} ${themeText}`}>
                {isElectric ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Meter History</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{meter.code} &middot; {meter.room?.name || 'Unit N/A'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex">
                  {[3, 6, 12].map(m => (
                    <button
                      key={m}
                      onClick={() => setMonths(m)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        months === m ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {m} Months
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Avg Monthly</p>
                  <p className={`text-xl font-black ${themeText}`}>
                    {avgConsumption} <span className="text-xs">{unit}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="h-64 mt-4 w-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Activity className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConsump" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={themeColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748B', fontWeight: 800, fontSize: '12px', marginBottom: '4px' }}
                      itemStyle={{ color: '#0F172A', fontWeight: 900, fontSize: '14px' }}
                      formatter={(value: number) => [`${value} ${unit}`, 'Consumption']}
                    />
                    <ReferenceLine y={avgConsumption} stroke="#94A3B8" strokeDasharray="3 3" />
                    <Area 
                      type="monotone" 
                      dataKey="consumption" 
                      stroke={themeColor} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorConsump)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <CalendarDays className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-bold">Not enough data to graph history.</p>
                </div>
              )}
            </div>

            {chartData.length > 0 && (
              <div className="mt-8 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-left bg-white dark:bg-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-xs uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">Date</th>
                      <th className="px-4 py-3 text-xs uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 text-right">Reading</th>
                      <th className="px-4 py-3 text-xs uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 text-right">Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {/* Show last 3 readings in table to not clutter */}
                    {[...chartData].reverse().slice(0, 3).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{row.fullDate}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 text-right">{row.reading.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white text-right">+{row.consumption.toLocaleString()} {unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

