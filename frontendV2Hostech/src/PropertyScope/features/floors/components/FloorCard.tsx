import { Layers, DoorOpen, Layout, ChevronRight } from 'lucide-react';

interface FloorCardProps {
  name: string;
  floorNumber: number;
  roomsCount: number;
  vacantCount: number;
  onClick: () => void;
}

export default function FloorCard({ name, floorNumber, roomsCount, vacantCount, onClick }: FloorCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-4xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-black/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden"
    >
        <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <Layers className="w-7 h-7" />
            </div>
            <div className="text-right">
                <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-1">Tầng</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-xl border border-slate-100 dark:border-slate-700/50">{floorNumber}</span>
            </div>
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {name}
        </h3>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{roomsCount || 0} <span className="text-slate-400 dark:text-slate-500 font-medium text-xs uppercase">Phòng</span></span>
            </div>
            <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{vacantCount || 0} <span className="text-emerald-400/60 dark:text-emerald-500/60 font-medium text-xs uppercase">Trống</span></span>
            </div>
        </div>

        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700">
            <ChevronRight className="w-6 h-6" />
        </div>
    </div>
  );
}
