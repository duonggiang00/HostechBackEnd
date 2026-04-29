import { useParams, useNavigate } from 'react-router-dom';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import RoomWizard from '@/PropertyScope/features/rooms/components/RoomWizard';

export default function RoomCreatePage() {
  const { propertyId, floorId } = useParams();
  const navigate = useNavigate();

  if (!propertyId) return null;

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto">
      <div className="flex items-center gap-6 px-4">
        <PageBackButton className="rounded-[20px] border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900" />
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
