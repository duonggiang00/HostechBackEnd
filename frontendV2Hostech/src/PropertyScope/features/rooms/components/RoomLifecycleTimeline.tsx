import { motion } from 'framer-motion';
import { History, Clock, RotateCcw, ArrowRight, User } from 'lucide-react';
import type { RoomStatusHistory } from '@/PropertyScope/features/rooms/types';

export default function RoomLifecycleTimeline({ 
  data, 
  isLoading 
}: { 
  data?: RoomStatusHistory[]; 
  isLoading?: boolean;
}) {
  const events = data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 bg-white border border-slate-200 rounded-3xl">
        <Clock className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Lịch sử Trạng thái Phòng</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Theo dõi Vòng đời Đơn vị</p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />

        <div className="space-y-8 relative">
          {events.map((event, index) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-6 relative"
            >
                {/* Status Dot */}
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    {event.from_status && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold line-through">
                        {event.from_status}
                      </span>
                    )}
                    {event.from_status && <ArrowRight className="w-3 h-3 text-slate-300" />}
                    <span className={`
                      px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider
                      ${event.to_status?.toLowerCase() === 'available' ? 'bg-emerald-100 text-emerald-700' : 
                        event.to_status?.toLowerCase() === 'occupied' ? 'bg-indigo-100 text-indigo-700' : 
                        event.to_status?.toLowerCase() === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'}
                    `}>
                      {event.to_status?.toLowerCase() === 'occupied' ? 'Đã thuê' : 
                       event.to_status?.toLowerCase() === 'available' ? 'Sẵn có' :
                       event.to_status?.toLowerCase() === 'maintenance' ? 'Bảo trì' :
                       event.to_status?.toLowerCase() === 'reserved' ? 'Đã đặt' :
                       event.to_status}
                    </span>
                  </div>
                  <time className="text-[10px] font-bold text-slate-400">
                    {new Date(event.created_at).toLocaleDateString()} at {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3 italic">
                    "{event.notes || 'Không có ghi chú'}"
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{event.actor_name || 'Hệ thống'}</span>
                    </div>
                    <button className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
         <button className="w-full py-3 bg-slate-50 text-slate-500 text-xs font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 flex items-center justify-center gap-2">
            Xem Nhật ký Kiểm tra Đầy đủ
            <History className="w-3.5 h-3.5" />
         </button>
      </div>
    </div>
  );
}
