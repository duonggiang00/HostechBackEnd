import { useNavigate, useParams } from 'react-router-dom';
import PropertyCard from '@/OrgScope/features/properties/components/PropertyCard';
import { Plus, Search, Filter, Loader2, DollarSign, Users, Activity, LogIn } from 'lucide-react';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';
import { useDashboard } from '@/adminSystem/features/dashboard/hooks/useDashboard';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

export default function PropertiesPage() {
  const { user } = useAuthStore();
  const { orgId: orgIdParam } = useParams<{ orgId: string }>();
  const orgId = orgIdParam || user?.org_id;
  
  const navigate = useNavigate();
  const { data: properties, isLoading: isPropsLoading, error: propsError } = useProperties({ 'filter[org_id]': orgId });
  const { data: dashboard, isLoading: isDashLoading } = useDashboard();

  if (isPropsLoading || isDashLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (propsError) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading properties. Please try again.
      </div>
    );
  }

  const dashData = dashboard?.data;
  const role = dashboard?.role;

  // Extract stats for the overview cards
  let totalRevenue = 0;
  let occupancy = 0;
  let activeContracts = 0;
  let totalRooms = 0;

  if (dashData) {
    if ('revenue' in dashData && (role === 'owner' || role === 'manager')) {
      totalRevenue = (dashData as any).revenue.current_period || (dashData as any).revenue.total || 0;
    }
    if ('properties' in dashData) {
      occupancy = dashData.properties.occupancy_rate || 0;
      totalRooms = dashData.properties.total_rooms || 0;
    }
    if ('contracts' in dashData) {
      activeContracts = dashData.contracts.total_active || 0;
    }
  }

  const stats = [
    { label: 'Revenue (MTD)', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Occupancy', value: `${occupancy}%`, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Active Leases', value: activeContracts, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Units', value: totalRooms, icon: LogIn, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Dashboard KPI Mini Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-3xl border border-slate-100 bg-white shadow-sm flex items-center gap-4`}
          >
            <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Properties</h1>
          <p className="text-slate-500 mt-1">Manage all your properties and hospitality zones.</p>
        </div>
        <button 
          onClick={() => navigate('/org/properties/add')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Property
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 border border-slate-100 rounded-xl bg-slate-50">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search properties by name or address..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-slate-600 font-bold text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties?.map((prop: any) => (
          <PropertyCard 
            key={prop.id}
            {...prop}
            roomCount={prop.roomCount || 0}
            staffCount={prop.staffCount || 0}
            onClick={() => navigate(`/properties/${prop.id}/dashboard`)}
          />
        ))}

        {/* Empty State / Add New Placeholder */}
        <div 
          onClick={() => navigate('/org/properties/add')}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 py-10 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
          </div>
          <p className="text-sm font-bold text-slate-600">Register New Property</p>
        </div>
      </div>
    </div>
  );
}
