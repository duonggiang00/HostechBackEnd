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
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Thêm phòng mới</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Thiết lập thông tin, dịch vụ và tài sản cho phòng của bạn.</p>
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
