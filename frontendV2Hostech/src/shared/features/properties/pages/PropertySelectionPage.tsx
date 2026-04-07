import { useNavigate } from 'react-router-dom';
import PropertyCard from '@/OrgScope/features/properties/components/PropertyCard';
import { Loader2, Search, Filter, Sparkles, MapPin, Building, ShieldCheck } from 'lucide-react';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { motion } from 'framer-motion';

export default function PropertySelectionPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: properties, isLoading, error } = useProperties({ 'filter[org_id]': user?.org_id || undefined });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-3xl">
        <p className="text-red-500 font-bold">Error loading properties. Please refresh and try again.</p>
      </div>
    );
  }

  // Use properties from API, fallback to user.properties from auth store if API returns empty
  const displayProperties = (properties && properties.length > 0) 
    ? properties 
    : (user?.properties || []);

  return (
    <div className="space-y-12">
      {/* Quick Stats / Info Header */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl border border-white dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <Building className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Cơ sở hiện có</p>
               <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{displayProperties.length}</p>
            </div>
         </div>
         <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block" />
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
               <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Trạng thái</p>
               <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Đã xác thực</p>
            </div>
         </div>
         <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block" />
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
               <Sparkles className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Vai trò</p>
               <p className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                {user?.role === 'Owner' ? 'Chủ sở hữu' : user?.role === 'Manager' ? 'Quản lý' : 'Nhân viên'}
               </p>
            </div>
         </div>
      </div>

      {/* Grid of properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayProperties.map((prop: any, i: number) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group"
          >
            <PropertyCard 
              {...prop}
              roomCount={prop.rooms_count || prop.room_count || 0}
              staffCount={prop.staff_count || 0}
              onClick={() => navigate(`/properties/${prop.id}/dashboard`)}
            />
          </motion.div>
        ))}

        {displayProperties.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No Properties Found</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                You are not currently assigned to any properties in this organization. Please contact your manager for access.
             </p>
          </div>
        )}
      </div>
      
      {/* Search/Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or address..."
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900/30 rounded-2xl outline-none shadow-xl shadow-slate-200/30 dark:shadow-none transition-all text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3.5 text-slate-600 dark:text-slate-400 font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-none transition-all">
            <Filter className="w-4 h-4" />
            Filters
          </button>
      </div>
    </div>
  );
}
