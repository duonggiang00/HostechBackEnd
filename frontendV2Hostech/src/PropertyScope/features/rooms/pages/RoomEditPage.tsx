import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import RoomWizard from '@/PropertyScope/features/rooms/components/RoomWizard';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { useRoom } from '@/PropertyScope/features/rooms/hooks/useRooms';

export default function RoomEditPage() {
  const { propertyId, roomId } = useParams();
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
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <PageBackButton className="rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Chỉnh sửa {room.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Cập nhật thông tin chi tiết, quy định, giá cả hoặc hình ảnh qua từng bước</p>
        </div>
      </div>

      <RoomWizard 
        initialData={room} 
        propertyId={propertyId!}
        floorId={room.floor_id || null}
        onSuccess={() => navigate(`/properties/${propertyId}/rooms/${roomId}`)}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
