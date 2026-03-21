import { Layers, DoorOpen, CheckCircle, Clock } from 'lucide-react';
import type { Property } from '@/OrgScope/features/properties/types';
import { motion } from 'framer-motion';

interface PropertyFloorsListProps {
  property: Property;
}

export function PropertyFloorsList({ property }: PropertyFloorsListProps) {
  const floors = property.floors ?? [];

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none mb-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-500/10 rounded-2xl">
          <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Danh sách tầng</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
            Tổng quan số lượng phòng trống / đã thuê
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {floors.length > 0 ? (
          floors.map((floor: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 group hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all flex flex-col gap-5 overflow-hidden relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Tầng {floor.name}</span>
                <span className="text-[10px] font-black px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400">{floor.rooms_count ?? 0} Phòng</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mb-1" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">{floor.occupied_rooms_count ?? 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Đã thuê</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                  <Clock className="w-4 h-4 text-amber-500 mb-1" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">{floor.vacant_rooms_count ?? 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Còn trống</span>
                </div>
              </div>

              {/* Mini progress bar at the bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${(floor.occupied_rooms_count / (floor.rooms_count || 1)) * 100}%` }} 
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
             <DoorOpen className="w-12 h-12 mb-3 opacity-20" />
             <p className="text-sm font-black italic uppercase tracking-widest">Chưa có thông tin tầng</p>
          </div>
        )}
      </div>
    </div>
  );
}
