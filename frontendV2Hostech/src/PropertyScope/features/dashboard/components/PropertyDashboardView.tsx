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
  if (!dashboard) return null;

  const { stats, revenueTrend } = dashboard;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Active Actions Row */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <button 
            onClick={onGenerateBilling}
            disabled={isGenerating}
            data-testid="generate-billing-btn"
            className={`flex items-center gap-2 px-4 py-2 ${isGenerating ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-sm rounded-xl text-xs font-bold transition-all`}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <CalendarCheck className="w-4 h-4" />
            )}
            Chạy hóa đơn định kỳ
          </button>
          <button className="px-4 py-2 bg-white dark:bg-slate-700 shadow-sm rounded-xl text-xs font-bold text-slate-800 dark:text-white">30 ngày qua</button>
          <button className="px-4 py-2 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors">Quý trước</button>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RevenueTrend data={revenueTrend} />
        </div>
        <div>
          <OccupancyGauge percentage={stats.occupancyRate} />
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <TicketSummary 
            pending={stats.pendingTickets} 
            unresolved={stats.unresolvedTickets} 
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-linear-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-lg relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-[0.05] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Tình trạng phòng</h3>
              <p className="text-indigo-100 font-medium max-w-md">Tòa nhà hiện có {stats.vacantRooms.toLocaleString('vi-VN')} phòng trống sẵn sàng cho thuê. Tỷ lệ lấp đầy hiện tại là {stats.occupancyRate}%.</p>
            </div>
            
            <div className="mt-12 flex flex-wrap gap-8 items-end justify-between">
              <div className="flex gap-12">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Đã thuê</p>
                  <p className="text-3xl font-black text-white">{stats.occupiedRooms.toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Trống</p>
                  <p className="text-3xl font-black text-white">{stats.vacantRooms.toLocaleString('vi-VN')}</p>
                </div>
              </div>
              
              <button className="px-6 py-3 bg-white text-indigo-700 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                Quản lý kho
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
