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
    <div className="min-h-screen pb-20">
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={handleCancel}
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight italic uppercase tracking-tighter">
            Ký Hợp Đồng Mới
          </h1>
          <p className="text-slate-500 font-bold">Bắt đầu quy trình thiết lập hợp đồng thuê mới.</p>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] shadow-2xl shadow-indigo-100/50 overflow-hidden">
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
