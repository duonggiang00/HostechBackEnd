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
      className="group bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
    >
        <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <Layers className="w-7 h-7" />
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Tầng</span>
                <span className="text-lg font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">{floorNumber}</span>
            </div>
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
            {name}
        </h3>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-700">{roomsCount || 0} <span className="text-slate-400 font-medium text-[10px] uppercase">Phòng</span></span>
            </div>
            <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-600">{vacantCount || 0} <span className="text-emerald-400/60 font-medium text-[10px] uppercase">Trống</span></span>
            </div>
        </div>

        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-indigo-600 shadow-sm border border-slate-100">
            <ChevronRight className="w-6 h-6" />
        </div>
    </div>
  );
}
