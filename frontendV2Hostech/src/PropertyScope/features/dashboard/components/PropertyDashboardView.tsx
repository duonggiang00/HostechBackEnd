import { StatCard } from '../components/StatCard';
import { RevenueTrend } from '../components/RevenueTrend';
import { OccupancyGauge } from '../components/OccupancyGauge';
import { TicketSummary } from '../components/TicketSummary';
import { Users, DoorOpen, FileText, TrendingUp, ScrollText, AlertTriangle, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/shared/hooks/useTheme';
import { Link, useNavigate } from 'react-router-dom';

import type { PropertyDashboardData } from '../types';

interface PropertyDashboardViewProps {
  dashboard: PropertyDashboardData;
  /** Khi có — liên kết Sổ cái + nút «Quản lý tòa nhà» (building-view). */
  propertyId?: string | null;
}

export function PropertyDashboardView({
  dashboard,
  propertyId,
}: PropertyDashboardViewProps) {
  const { fontSize } = useTheme();
  const navigate = useNavigate();
  const isLargeFont = fontSize === 'lg';

  if (!dashboard) return null;

  const { stats, revenueTrend } = dashboard;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {propertyId ? (
        <div className="flex justify-end">
          <Link
            to={`/properties/${propertyId}/finance/ledger`}
            data-testid="ledger-link"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ScrollText className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
            Sổ cái
          </Link>
        </div>
      ) : null}

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Khách thuê hiện tại" 
          value={stats.totalTenants.toLocaleString('vi-VN')} 
          icon={Users} 
          color="blue"
          trend={{ value: Math.abs(stats.tenantTrendValue ?? 0), isUp: (stats.tenantTrendValue ?? 0) >= 0 }}
          testId="stat-tenants"
        />
        <StatCard 
          label="Tổng số phòng" 
          value={stats.totalRooms.toLocaleString('vi-VN')} 
          icon={DoorOpen} 
          color="gray"
          testId="stat-rooms"
        />
        <StatCard 
          label="Hợp đồng hiệu lực" 
          value={(stats.activeContracts ?? 0).toLocaleString('vi-VN')} 
          icon={FileText} 
          color="violet"
          testId="stat-active-contracts"
        />
        <StatCard 
          label="Doanh thu tháng này" 
          value={stats.thisMonthRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })} 
          icon={TrendingUp} 
          color="emerald"
          trend={{ value: Math.abs(stats.revenueTrendValue ?? 0), isUp: (stats.revenueTrendValue ?? 0) >= 0 }}
          testId="stat-revenue"
        />
      </div>

      {/* Debt Alert Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <StatCard
          label="Hợp đồng nợ quá hạn"
          value={(stats.overdueContractCount ?? 0).toLocaleString('vi-VN')}
          icon={AlertTriangle}
          color="rose"
          testId="stat-overdue-contracts"
        />
        <StatCard
          label="Tổng tiền nợ"
          value={(stats.totalOutstandingDebt ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          icon={Banknote}
          color="amber"
          testId="stat-outstanding-debt"
        />
      </div>

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
            propertyId={propertyId}
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${isLargeFont ? 'lg:col-span-2' : 'lg:col-span-2'} bg-blue-900 p-6 md:p-8 rounded-[12px] shadow-sm border border-blue-800 relative overflow-hidden group`}
        >
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 translate-x-1/3 blur-2xl group-hover:scale-110 transition-transform" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Tình trạng phòng</h3>
              <p className="text-blue-100 text-[14px] max-w-md font-medium leading-relaxed">Tòa nhà hiện có {stats.vacantRooms.toLocaleString('vi-VN')} phòng trống sẵn sàng cho thuê. Tỷ lệ lấp đầy hiện tại là {stats.occupancyRate}%.</p>
            </div>
            
            <div className="mt-8 flex flex-wrap gap-6 md:gap-12 items-end justify-between">
              <div className="flex gap-8 md:gap-12">
                <div>
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1.5">Đã thuê</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stats.occupiedRooms.toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1.5">Trống</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stats.vacantRooms.toLocaleString('vi-VN')}</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() =>
                  propertyId
                    ? navigate(`/properties/${propertyId}/building-view`)
                    : navigate('/org/properties')
                }
                className="px-5 py-2.5 flex items-center justify-center bg-white text-blue-900 text-sm font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                Quản lý tòa nhà
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
