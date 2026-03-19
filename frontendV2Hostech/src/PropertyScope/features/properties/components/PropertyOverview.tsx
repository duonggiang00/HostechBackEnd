import { LayoutGrid, Layers, DoorOpen, Maximize2 } from 'lucide-react';
import type { Property } from '../types';

interface PropertyOverviewProps {
  property: Property;
}

export function PropertyOverview({ property }: PropertyOverviewProps) {
  const stats = [
    { 
      label: 'Tổng diện tích', 
      value: `${property.area} m²`, 
      icon: Maximize2, 
      color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
    },
    { 
      label: 'Diện tích chung', 
      value: `${property.shared_area} m²`, 
      icon: LayoutGrid, 
      color: 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' 
    },
    { 
      label: 'Số tầng', 
      value: property.stats?.total_floors ?? property.floors_count ?? 0, 
      icon: Layers, 
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' 
    },
    { 
      label: 'Tổng số phòng', 
      value: property.stats?.total_rooms ?? property.rooms_count ?? 0, 
      icon: DoorOpen, 
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
          <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
            <stat.icon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
