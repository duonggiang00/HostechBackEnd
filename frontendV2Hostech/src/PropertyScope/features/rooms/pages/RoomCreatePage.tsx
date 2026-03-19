import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import RoomWizard from '@/PropertyScope/features/rooms/components/RoomWizard';

export default function RoomCreatePage() {
  const { propertyId, floorId } = useParams();
  const navigate = useNavigate();

  if (!propertyId) return null;

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto">
      <div className="flex items-center gap-6 px-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3.5 bg-white border border-slate-200 rounded-[20px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Thêm phòng mới</h1>
          <p className="text-slate-500 mt-2 font-medium">Thiết lập thông tin, dịch vụ và tài sản cho phòng của bạn.</p>
        </div>
      </div>

      <div>
        <RoomWizard 
          propertyId={propertyId} 
          floorId={floorId}
          onSuccess={() => navigate(-1)}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
