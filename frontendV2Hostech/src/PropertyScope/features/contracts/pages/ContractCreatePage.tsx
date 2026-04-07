import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ContractWizard from '../components/ContractWizard';
import { ChevronLeft } from 'lucide-react';

export default function ContractCreatePage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId') || '';
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(`/properties/${propertyId}/contracts`);
  };

  const handleCancel = () => {
    if (roomId) {
      navigate(`/properties/${propertyId}/rooms/${roomId}`);
    } else {
      navigate(`/properties/${propertyId}/contracts`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] pb-8 transition-colors">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <button 
          onClick={handleCancel}
          className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
            Ký Hợp Đồng Mới
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Thiết lập hợp đồng thuê mới.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden transition-colors">
        <ContractWizard 
          propertyId={propertyId as string}
          roomId={roomId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
