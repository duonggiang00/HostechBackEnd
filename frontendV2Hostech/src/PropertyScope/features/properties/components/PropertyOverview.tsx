import { LayoutGrid, Layers, DoorOpen, Maximize2 } from 'lucide-react';
import type { Property } from '@/OrgScope/features/properties/types';
import { motion } from 'framer-motion';

interface PropertyOverviewProps {
  property: Property;
}

export function PropertyOverview({ property }: PropertyOverviewProps) {
  const stats = [
    { 
      label: 'Tổng diện tích', 
      value: `${property.area} m²`, 
      icon: Maximize2, 
      description: 'Diện tích toàn bộ tòa nhà',
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
    },
    { 
      label: 'Diện tích chung', 
      value: `${property.shared_area} m²`, 
      icon: LayoutGrid, 
      description: 'Hành lang, thang máy, sân',
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' 
    },
    { 
      label: 'Số tầng', 
      value: property.stats?.total_floors ?? property.floors_count ?? 0, 
      icon: Layers, 
      description: 'Các tầng quản lý hiện tại',
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' 
    },
    { 
      label: 'Tổng số phòng', 
      value: property.stats?.total_rooms ?? property.rooms_count ?? 0, 
      icon: DoorOpen, 
      description: 'Phòng đang cho thuê/trống',
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {stats.map((stat, idx) => (
        <motion.div 
          key={idx} 
          variants={item}
          whileHover={{ y: -5 }}
          className="relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm p-7 rounded-4xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col gap-6 group overflow-hidden"
        >
          {/* Subtle background glow on hover */}
          <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-0 group-hover:opacity-5 rounded-full blur-3xl transition-opacity duration-500 -translate-y-1/2 translate-x-1/2`} />
          
          <div className={`${stat.lightColor} w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 border border-current opacity-100`}>
            <stat.icon className="w-8 h-8" />
          </div>
          
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{stat.value}</p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">{stat.description}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
