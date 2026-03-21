import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomDetail } from '@/PropertyScope/features/rooms/hooks/useRooms';
import RoomDetailContent from '@/PropertyScope/features/rooms/components/RoomDetailContent';

interface RoomDetailDrawerProps {
  roomId: string | null | undefined;
  propertyId: string | undefined;
  onClose: () => void;
  onOpenManagement?: (mode: 'contract' | 'edit') => void;
}

export default function RoomDetailDrawer({ roomId, propertyId, onClose, onOpenManagement }: RoomDetailDrawerProps) {
  const { data: room, isLoading, error } = useRoomDetail(roomId as string);

  if (!roomId) return null;

  return (
    <AnimatePresence>
      {roomId && (
        <>
          {/* Backdrop */}
          <motion.div 
            key="overlay"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm z-60"
            onClick={onClose}
          />
          
          {/* Drawer Content */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] max-w-[100vw] bg-white dark:bg-slate-900 shadow-2xl z-70 overflow-y-auto custom-scrollbar border-l border-slate-200 dark:border-slate-800"
          >
            {isLoading ? (
              <div className="flex flex-col h-full items-center justify-center p-12">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải chi tiết...</p>
              </div>
            ) : error || !room ? (
              <div className="flex flex-col h-full items-center justify-center p-12 text-center">
                 <X className="w-16 h-16 text-rose-200 dark:text-rose-500/50 mb-6" />
                 <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Lỗi tải phòng</h3>
                 <p className="text-slate-500 dark:text-slate-400 max-w-xs">{error?.message || 'Không thể lấy thông tin chi tiết cho đơn vị này.'}</p>
                 <button onClick={onClose} className="mt-8 px-8 py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors text-white rounded-2xl font-bold">Đóng ngăn kéo</button>
              </div>
            ) : (
              <RoomDetailContent 
                room={room} 
                isLoading={isLoading} 
                propertyId={propertyId} 
                onClose={onClose} 
                onOpenManagement={onOpenManagement} 
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
