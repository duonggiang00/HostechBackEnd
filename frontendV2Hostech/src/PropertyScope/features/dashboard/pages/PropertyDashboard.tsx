import { useParams } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/StatCard';
import { RevenueTrend } from '../components/RevenueTrend';
import { OccupancyGauge } from '../components/OccupancyGauge';
import { TicketSummary } from '../components/TicketSummary';
import { 
  Users, 
  DoorOpen, 
  Receipt, 
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PropertyDashboard() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: dashboard, isLoading } = useDashboard(propertyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) return null;

  const { stats, revenueTrend } = dashboard;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Property Overview</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Real-time performance metrics and insights</p>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <button className="px-4 py-2 bg-white dark:bg-slate-700 shadow-sm rounded-xl text-xs font-bold text-slate-800 dark:text-white">Last 30 Days</button>
          <button className="px-4 py-2 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors">LastQuarter</button>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Current Tenants" 
          value={stats.totalTenants} 
          icon={Users} 
          color="indigo"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard 
          label="Total Rooms" 
          value={stats.totalRooms} 
          icon={DoorOpen} 
          color="emerald"
        />
        <StatCard 
          label="Unpaid Invoices" 
          value={stats.unpaidInvoices} 
          icon={Receipt} 
          color="rose"
          trend={{ value: 5, isUp: false }}
        />
        <StatCard 
          label="This Month Revenue" 
          value={`$${(stats.thisMonthRevenue / 1000).toFixed(1)}k`} 
          icon={TrendingUp} 
          color="amber"
          trend={{ value: 8, isUp: true }}
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
          className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-lg relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-[0.05] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Room Availability Overview</h3>
              <p className="text-indigo-100 font-medium max-w-md">The building currently has {stats.vacantRooms} vacant rooms ready for lease. THe current occupancy is {stats.occupancyRate}%.</p>
            </div>
            
            <div className="mt-12 flex flex-wrap gap-8 items-end justify-between">
              <div className="flex gap-12">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Occupied</p>
                  <p className="text-3xl font-black text-white">{stats.occupiedRooms}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Vacant</p>
                  <p className="text-3xl font-black text-white">{stats.vacantRooms}</p>
                </div>
              </div>
              
              <button className="px-6 py-3 bg-white text-indigo-700 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                Manage Inventory
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
