import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wrench, 
  DollarSign, 
  BarChart3,
  Calendar,
  ArrowUpRight
} from 'lucide-react';

import { useDashboard } from '@/adminSystem/features/dashboard/hooks/useDashboard';
import { Loader2 } from 'lucide-react';

export default function ManagementAnalytics() {
  const { data: dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest italic">Synthesizing Operational Data...</p>
      </div>
    );
  }

  const dashData = dashboard?.data;

  // Extract variables based on dashboard support
  let occupancy = 0;
  let mttr = 0;
  let revenue = 0;
  let revenueTrend = '+0%';

  if (dashData) {
    if ('properties' in dashData) {
      occupancy = dashData.properties.occupancy_rate;
    }
    
    if ('tickets' in dashData && 'mttr_hours' in dashData.tickets) {
      mttr = (dashData.tickets as any).mttr_hours;
    }

    if ('revenue' in dashData) {
      const rev = dashData.revenue as any;
      revenue = rev.current_period || rev.total || 0;
      if (rev.change_percent !== undefined) {
        revenueTrend = `${rev.change_percent >= 0 ? '+' : ''}${rev.change_percent}%`;
      }
    }
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const kpis = [
    { label: 'Occupancy Rate', value: `${occupancy}%`, trend: '+0%', icon: Users, color: 'emerald' },
    { label: 'Maintenance MTTR', value: `${mttr}h`, trend: 'Last 30d', icon: Wrench, color: 'amber' },
    { label: 'Revenue Intake', value: formatCurrency(revenue), trend: revenueTrend, icon: DollarSign, color: 'blue' }
  ];

  return (
    <div className="space-y-8 p-1">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all"
          >
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
              <kpi.icon className="w-24 h-24" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl bg-${kpi.color}-500/10 border border-${kpi.color}-500/20 flex items-center justify-center text-${kpi.color}-400`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{kpi.label}</span>
            </div>

            <div className="flex items-end justify-between">
              <h4 className="text-4xl font-black text-white tracking-tighter italic uppercase truncate max-w-[70%]">{kpi.value}</h4>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-${kpi.color}-500/10 text-${kpi.color}-400 border border-${kpi.color}-500/20`}>
                {kpi.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : (kpi.trend.startsWith('-') ? <TrendingDown className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />)}
                {kpi.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Occupancy Chart Mock */}
        <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Occupancy Trends</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Growth over the last 6 months</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
              <Calendar className="w-3 h-3" />
              Last 6M
            </button>
          </div>

          <div className="h-64 flex items-end gap-3 px-2">
            {[45, 60, 55, 80, 75, 94].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: idx * 0.1, duration: 1 }}
                    className={`w-full rounded-t-2xl relative transition-all duration-500 bg-gradient-to-t from-emerald-500 to-emerald-400 group-hover:from-white group-hover:to-emerald-400`}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-white bg-[#0A0A0B] px-2 py-1 rounded border border-white/10">
                    {height}%
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{['OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'][idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Breakdown Mock */}
        <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Task Efficiency</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Maintenance resolution metrics</p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { label: 'Electrical Repairs', count: 12, avg: '3.2h', percent: 85, color: 'yellow' },
              { label: 'Plumbing Works', count: 8, avg: '5.1h', percent: 62, color: 'blue' },
              { label: 'General Cleaning', count: 24, avg: '1.2h', percent: 98, color: 'emerald' },
              { label: 'Security Items', count: 4, avg: '2.4h', percent: 45, color: 'rose' }
            ].map((item, idx) => (
              <div key={item.label} className="group cursor-default">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <span className="text-xs font-black text-white uppercase italic tracking-wider block">{item.label}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.count} Tasks completed</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black text-${item.color}-400 italic uppercase tracking-wider block`}>{item.avg} Avg</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">MTTR Report</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    className={`h-full bg-${item.color}-400 shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                    transition={{ delay: 0.5 + (idx * 0.1) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div className="mt-12 p-8 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-black text-white italic uppercase tracking-tight">Portfolio Optimization</h4>
            <p className="text-sm text-indigo-200/50 font-medium">Based on current trends, occupancy will hit 98% by May. Consider adjusting rates for new contracts.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-8 py-5 rounded-[2rem] bg-white text-[#0A0A0B] font-black italic uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all">
          View Detailed PDF
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
