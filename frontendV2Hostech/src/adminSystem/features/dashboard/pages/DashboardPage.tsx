import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useDashboard } from '@/adminSystem/features/dashboard/hooks/useDashboard';
import { Users, Building2, CheckCircle2, TrendingUp, AlertCircle, Loader2, DollarSign } from 'lucide-react';
import type { DashboardData } from '@/adminSystem/features/dashboard/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { propertyId } = useParams<{ propertyId?: string }>();
  const organizationId = user?.org_id;
  const { data: dashboardResp, isLoading, error } = useDashboard(propertyId, organizationId);

  // For Admin and Owner, continue showing the global dashboard
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !dashboardResp) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-rose-100 mt-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Failed to load analytics</h3>
        <p className="text-slate-500 mt-2">There was a problem fetching your dashboard data. Please try again later.</p>
      </div>
    );
  }

  const { data } = dashboardResp;

  const extractStats = (data: DashboardData) => {
    let revenue = 0;
    let occupancy = 0;
    let properties = 0;
    let rooms = 0;
    let activeLeases = 0;

    if ('revenue' in data) {
      revenue = (data as any).revenue?.current_period ?? (data as any).revenue?.total ?? 0;
    }
    
    if ('properties' in data) {
      occupancy = data.properties.occupancy_rate || 0;
      properties = data.properties.total_properties || 0;
      rooms = data.properties.total_rooms || 0;
    }

    if ('contracts' in data) {
      activeLeases = data.contracts.total_active || 0;
    }

    return [
      { 
        label: 'Monthly Revenue', 
        value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(revenue),
        icon: DollarSign, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50' 
      },
      { 
        label: 'Occupancy Rate', 
        value: `${occupancy}%`, 
        icon: TrendingUp, 
        color: 'text-indigo-600', 
        bg: 'bg-indigo-50' 
      },
      { 
        label: 'Properties Managed', 
        value: properties, 
        icon: Building2, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50' 
      },
      { 
        label: 'Active Leases', 
        value: activeLeases, 
        icon: CheckCircle2, 
        color: 'text-purple-600', 
        bg: 'bg-purple-50' 
      },
      {
        label: 'Total Units',
        value: rooms,
        icon: Users,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
      }
    ];
  };

  const overviewStats = extractStats(data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.full_name || 'User'}
          </h1>
          <p className="text-slate-500 mt-1 text-lg">
            Here's what's happening across your {propertyId ? 'property' : organizationId ? 'organization' : 'portfolio'} today.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {overviewStats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 + 0.1 }}
            className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col gap-3"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 bg-white rounded-3xl border border-slate-200 p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Revenue Analytics Chart</h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              Visualizing your income and expense streams over time. We are currently calibrating the chart engines.
            </p>
        </div>

        <div className="col-span-1 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none" />
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                <AlertCircle className="w-5 h-5 text-indigo-400" />
                Action Items
            </h3>
            
            <div className="space-y-4 relative z-10">
                {('contracts' in data) && (data.contracts.expiring_in_30_days ?? 0) > 0 && (
                    <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                        <p className="text-sm font-bold text-slate-200 mb-1">Renewals Approaching</p>
                        <p className="text-xs text-slate-400">{(data.contracts as any).expiring_in_30_days} leases expire in the next 30 days.</p>
                    </div>
                )}
                {('tickets' in data) && (data.tickets.pending ?? 0) > 0 && (
                    <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                        <p className="text-sm font-bold text-rose-400 mb-1">Maintenance Requires Attention</p>
                        <p className="text-xs text-slate-400">{(data.tickets as any).pending} pending maintenance requests.</p>
                    </div>
                )}
                <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 border-dashed opacity-50 text-center py-6">
                    <p className="text-xs font-medium text-slate-400">All caught up!</p>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
