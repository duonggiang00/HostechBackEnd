import React from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';

interface InvoiceSidebarProps {
  isOpen: boolean;
  onNavigateBack: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredRooms: any[];
  selectedRoomId: string | null;
  onSelectRoom: (id: string) => void;
  isLoading: boolean;
}

export const InvoiceSidebar: React.FC<InvoiceSidebarProps> = ({
  isOpen,
  onNavigateBack,
  searchTerm,
  onSearchChange,
  filteredRooms,
  selectedRoomId,
  onSelectRoom,
  isLoading
}) => {
  return (
    <div className={cn(
      "bg-white border-r flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-500 ease-in-out relative z-40 h-full",
      isOpen ? "w-[340px]" : "w-0 overflow-hidden opacity-0 -translate-x-full"
    )}>
      <div className="p-8 border-b space-y-6 shrink-0">
         <PageBackButton
          onBack={onNavigateBack}
          className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 hover:text-slate-900"
        />
        
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-[0.25em] text-slate-400">CHỌN PHÒNG</h3>
          <div className="px-2 py-1 bg-slate-100 rounded-md text-[9px] font-black text-slate-500">{filteredRooms.length} PHÒNG</div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-slate-300 group-focus-within:text-teal-500 transition-colors" size={16} />
          </div>
          <input
            type="text"
            placeholder="Gõ số phòng..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-teal-500/30 focus:ring-4 focus:ring-teal-500/5 transition-all font-bold placeholder:text-slate-300 shadow-inner"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-2">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={cn(
                  "w-full px-6 py-5 flex items-center justify-between rounded-3xl transition-all duration-300 group text-left mb-1",
                  selectedRoomId === room.id 
                    ? "bg-teal-600 text-white shadow-xl shadow-teal-500/20 translate-x-1" 
                    : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className="overflow-hidden">
                  <div className={cn(
                    "font-black text-base tracking-tighter transition-colors leading-none",
                    selectedRoomId === room.id ? "text-white" : "text-slate-900"
                  )}>{room.name}</div>
                  <div className={cn(
                    "text-[9px] uppercase font-black tracking-[0.2em] truncate mt-1.5 opacity-60",
                    selectedRoomId === room.id ? "text-teal-100" : "text-slate-400"
                  )}>
                    {room.code} • {room.contracts?.some((c: any) => c.status === 'ACTIVE') ? 'ĐANG Ở' : 'TRỐNG'}
                  </div>
                </div>
                <ChevronRight 
                  size={18} 
                  className={cn(
                    "transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
                    selectedRoomId === room.id && "opacity-100 translate-x-1 text-teal-200"
                  )} 
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
