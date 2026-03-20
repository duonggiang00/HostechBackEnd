import { Layers, DoorOpen, Layout, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloorListItemProps {
  name: string;
  floorNumber: number;
  roomsCount: number;
  vacantCount: number;
  isTrash?: boolean;
  onRestore?: () => void;
  onForceDelete?: () => void;
  onClick: () => void;
}

export default function FloorListItem({ 
  name, 
  floorNumber, 
  roomsCount, 
  vacantCount, 
  isTrash, 
  onRestore, 
  onForceDelete, 
  onClick 
}: FloorListItemProps) {
  return (
    <motion.div 
      layout
      className={`group flex items-center justify-between p-4 bg-white border ${isTrash ? 'border-red-100 hover:border-red-200 bg-red-50/10' : 'border-slate-200 hover:border-indigo-200'} rounded-2xl transition-all cursor-pointer hover:shadow-lg hover:shadow-slate-200/50`}
      onClick={isTrash ? undefined : onClick}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${isTrash ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
          <Layers className="w-6 h-6" />
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold ${isTrash ? 'text-red-900' : 'text-slate-900 group-hover:text-indigo-600'} transition-colors`}>{name}</h3>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${isTrash ? 'border-red-200 bg-red-100 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>TẦNG {floorNumber}</span>
          </div>
          
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">{roomsCount} <span className="text-slate-400 font-medium">phòng</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-600">{vacantCount} <span className="text-emerald-400/60 font-medium tracking-tight">Trống</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isTrash ? (
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onRestore?.(); }}
              className="p-2.5 rounded-xl bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
              title="Khôi phục"
            >
              <RotateCcw className="w-4 h-4" />
              Khôi phục
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onForceDelete?.(); }}
              className="p-2.5 rounded-xl bg-white border border-red-100 text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
              title="Xóa vĩnh viễn"
            >
              <Trash2 className="w-4 h-4" />
              Xóa vĩnh viễn
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
