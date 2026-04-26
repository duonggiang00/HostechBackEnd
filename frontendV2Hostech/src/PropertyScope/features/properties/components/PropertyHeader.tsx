import { Building2, MapPin, Hash, FileEdit, Layers } from 'lucide-react';
import type { Property } from '@/OrgScope/features/properties/types';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface PropertyHeaderProps {
  property: Property;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-6 border border-white dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden mb-8 group">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60 group-hover:bg-indigo-500/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-40" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="w-20 h-20 bg-linear-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none shrink-0"
          >
            <Building2 className="w-10 h-10 text-white" />
          </motion.div>
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                {property.name}
              </h1>
              <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20 flex items-center gap-2 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 group/item">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover/item:bg-indigo-50 dark:group-hover/item:bg-indigo-500/10 transition-colors">
                  <Hash className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-sm font-black tracking-widest text-slate-600 dark:text-slate-300">{property.code}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 group/item">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover/item:bg-indigo-50 dark:group-hover/item:bg-indigo-500/10 transition-colors">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-sm font-bold">{property.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">


          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(`/properties/${property.id}/building-info`)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs hover:border-indigo-300 dark:hover:border-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm group/btn whitespace-nowrap"
            >
              <FileEdit className="w-4 h-4 group-hover/btn:scale-120 transition-transform" />
              Chỉnh sửa
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 dark:shadow-none group/action whitespace-nowrap">
              <Layers className="w-4 h-4 group-hover/action:rotate-12 transition-transform" />
              Sơ đồ tầng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
