import { Building2, MapPin, Hash, CheckCircle2 } from 'lucide-react';
import type { Property } from '../types';

interface PropertyHeaderProps {
  property: Property;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200/50 dark:shadow-none translate-y-[-4px]">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {property.name}
              </h1>
              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Hash className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold tracking-tight uppercase tracking-tighter">{property.code}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium">{property.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 dark:shadow-none">
            Edit Information
          </button>
        </div>
      </div>
    </div>
  );
}
