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
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="p-12 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-3xl m-8">
         <AlertCircle className="w-12 h-12 mx-auto mb-4" />
         <h3 className="text-xl font-bold mb-2">Error Loading Room</h3>
         <p>Something went wrong while fetching room data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Edit {room.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Update details, rules, pricing, or media</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
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
