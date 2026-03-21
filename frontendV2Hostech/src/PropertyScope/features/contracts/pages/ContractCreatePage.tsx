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
    <div className="min-h-screen pb-20 transition-colors">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <button 
          onClick={handleCancel}
          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all shadow-sm group"
        >
          <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight italic uppercase tracking-tighter transition-colors">
            Ký Hợp Đồng Mới
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold transition-colors">Bắt đầu quy trình thiết lập hợp đồng thuê mới.</p>
        </div>
      </div>

      <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-slate-700 rounded-6xl shadow-2xl shadow-indigo-100/50 dark:shadow-none overflow-hidden transition-colors">
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
