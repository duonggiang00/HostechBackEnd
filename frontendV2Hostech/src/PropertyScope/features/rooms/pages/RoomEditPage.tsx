import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import RoomForm from '@/PropertyScope/features/rooms/components/RoomForm';
import { useRoom } from '@/PropertyScope/features/rooms/hooks/useRooms';

export default function RoomEditPage() {
  const { propertyId, floorId, roomId } = useParams();
  const navigate = useNavigate();

  const { data: room, isLoading, error } = useRoom(roomId);

  if (!propertyId || !roomId) return null;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="p-12 text-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-3xl m-8">
         <AlertCircle className="w-12 h-12 mx-auto mb-4" />
         <h3 className="text-xl font-bold mb-2">Lỗi tải dữ liệu phòng</h3>
         <p>Đã xảy ra lỗi khi tải dữ liệu phòng.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Chỉnh sửa {room.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Cập nhật thông tin chi tiết, quy định, giá cả hoặc hình ảnh</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <RoomForm 
          initialData={room}
          propertyId={propertyId} 
          floorId={floorId || room.floor_id}
          onSuccess={() => navigate(-1)}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
