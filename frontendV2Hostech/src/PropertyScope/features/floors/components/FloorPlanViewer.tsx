import { useState } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, MousePointer2 } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'draft';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FloorPlanViewerProps {
  rooms: Room[];
  selectedRoomId?: string;
  onRoomSelect: (roomId: string) => void;
}

export default function FloorPlanViewer({ rooms, selectedRoomId, onRoomSelect }: FloorPlanViewerProps) {
  const [zoom, setZoom] = useState(1);

  const statusColors = {
    available: { 
      fill: 'fill-emerald-50', 
      stroke: 'stroke-emerald-500', 
      bg: 'bg-emerald-500', 
      label: 'Còn trống' 
    },
    occupied: { 
      fill: 'fill-indigo-50', 
      stroke: 'stroke-indigo-600', 
      bg: 'bg-indigo-600', 
      label: 'Đang thuê' 
    },
    maintenance: { 
      fill: 'fill-amber-50', 
      stroke: 'stroke-amber-500', 
      bg: 'bg-amber-500', 
      label: 'Bảo trì' 
    },
    reserved: { 
      fill: 'fill-rose-50', 
      stroke: 'stroke-rose-500', 
      bg: 'bg-rose-500', 
      label: 'Đã đặt' 
    },
    draft: { 
      fill: 'fill-slate-50', 
      stroke: 'stroke-slate-400', 
      bg: 'bg-slate-400', 
      label: 'Bản nháp' 
    },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative group">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={() => setZoom(z => Math.min(z + 0.25, 2))}
          className="p-2 bg-white/80 backdrop-blur border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
          className="p-2 bg-white/80 backdrop-blur border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold shadow-lg shadow-indigo-200">
          <MousePointer2 className="w-3 h-3" />
          INTERACTIVE VIEW
        </div>
      </div>

      <div className="p-8 flex items-center justify-center min-h-[500px] overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
        <motion.div 
          animate={{ scale: zoom }}
          className="relative"
          style={{ width: '800px', height: '400px' }}
        >
          <svg 
            viewBox="0 0 800 400" 
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.05))' }}
          >
            {/* Floor Boundary */}
            <rect 
              x="5" y="5" width="790" height="390" 
              rx="20" 
              className="fill-slate-50 stroke-slate-200 stroke-2" 
            />

            {/* Rooms */}
            {rooms.map((room) => {
              const colors = statusColors[room.status] || statusColors.available;
              const isSelected = selectedRoomId === room.id;

              return (
                <motion.g
                  key={room.id}
                  onClick={() => onRoomSelect(room.id)}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer transition-all outline-none"
                >
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    rx="12"
                    className={`
                      ${colors.fill} ${colors.stroke} stroke-2 transition-all
                      ${isSelected ? 'stroke-indigo-600 stroke-[3px] shadow-lg ring-4 ring-indigo-500/20' : 'group-hover/room:stroke-slate-400'}
                    `}
                  />
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-black text-slate-900 select-none pointer-events-none"
                  >
                    {room.name}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-x-8 gap-y-3">
        {Object.entries(statusColors).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-full ${colors.bg} border-2 border-white shadow-sm ring-1 ring-slate-200`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
              {colors.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
