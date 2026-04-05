import { StatCard } from '../components/StatCard';
import { RevenueTrend } from '../components/RevenueTrend';
import { OccupancyGauge } from '../components/OccupancyGauge';
import { TicketSummary } from '../components/TicketSummary';
import { 
  Users, 
  DoorOpen, 
  Receipt, 
  TrendingUp,
  CalendarCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/shared/hooks/useTheme';

import type { PropertyDashboardData } from '../types';

interface PropertyDashboardViewProps {
  dashboard: PropertyDashboardData;
  isGenerating: boolean;
  onGenerateBilling: () => Promise<void>;
}

export function PropertyDashboardView({ 
  dashboard, 
  isGenerating, 
  onGenerateBilling 
}: PropertyDashboardViewProps) {
  const { fontSize } = useTheme();
  const isLargeFont = fontSize === 'lg';

  if (!dashboard) return null;

  const { stats, revenueTrend } = dashboard;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Active Actions Row */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <button 
            onClick={onGenerateBilling}
            disabled={isGenerating}
            data-testid="generate-billing-btn"
            className={`flex items-center gap-2 px-4 py-2 ${isGenerating ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-sm rounded-xl text-[11px] font-bold transition-all`}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <CalendarCheck className="w-3.5 h-3.5" />
            )}
            Chạy hóa đơn
          </button>
          <button className="px-3 py-1.5 bg-white dark:bg-slate-700 shadow-xs rounded-lg text-[11px] font-bold text-slate-800 dark:text-white">30 ngày qua</button>
          <button className="px-3 py-1.5 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 transition-colors">Quý trước</button>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          label="Khách thuê hiện tại" 
          value={stats.totalTenants.toLocaleString('vi-VN')} 
          icon={Users} 
          color="indigo"
          trend={{ value: 12, isUp: true }}
          testId="stat-tenants"
        />
        <StatCard 
          label="Tổng số phòng" 
          value={stats.totalRooms.toLocaleString('vi-VN')} 
          icon={DoorOpen} 
          color="emerald"
          testId="stat-rooms"
        />
        <StatCard 
          label="Hóa đơn chưa thanh toán" 
          value={stats.unpaidInvoices} 
          icon={Receipt} 
          color="rose"
          trend={{ value: 5, isUp: false }}
          testId="stat-unpaid"
        />
        <StatCard 
          label="Doanh thu tháng này" 
          value={stats.thisMonthRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })} 
          icon={TrendingUp} 
          color="amber"
          trend={{ value: 8, isUp: true }}
          testId="stat-revenue"
        />
      </div>

      {/* Main Charts Row */}
      {isLargeFont ? (
        <div className="w-full">
          <RevenueTrend data={revenueTrend} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueTrend data={revenueTrend} />
          </div>
          <div className="col-span-1">
            <OccupancyGauge percentage={stats.occupancyRate} />
          </div>
        </div>
      )}

      {/* Secondary Row & Occupancy Gauge in 'L' mode */}
      <div className={`grid grid-cols-1 ${isLargeFont ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
        {isLargeFont && <OccupancyGauge percentage={stats.occupancyRate} />}
        
        <div className={isLargeFont ? 'col-span-1' : ''}>
          <TicketSummary 
            pending={stats.pendingTickets} 
            unresolved={stats.unresolvedTickets} 
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${isLargeFont ? 'lg:col-span-2' : 'lg:col-span-2'} bg-linear-to-br from-indigo-600 to-indigo-800 p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden group`}
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-[0.05] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Tình trạng phòng</h3>
              <p className="text-indigo-100 text-sm font-medium max-w-md">Tòa nhà hiện có {stats.vacantRooms.toLocaleString('vi-VN')} phòng trống sẵn sàng cho thuê. Tỷ lệ lấp đầy hiện tại là {stats.occupancyRate}%.</p>
            </div>
            
            <div className="mt-8 md:mt-12 flex flex-wrap gap-6 md:gap-12 items-end justify-between">
              <div className="flex gap-8 md:gap-12">
                <div>
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Đã thuê</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stats.occupiedRooms.toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Trống</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stats.vacantRooms.toLocaleString('vi-VN')}</p>
                </div>
              </div>
              
              <button className="px-5 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                Quản lý kho
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
