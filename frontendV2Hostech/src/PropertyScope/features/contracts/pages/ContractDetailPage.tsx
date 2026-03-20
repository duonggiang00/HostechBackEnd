import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, User, Home, Calendar, Shield } from 'lucide-react';

export default function ContractDetailPage() {
  const { propertyId, contractId } = useParams<{ propertyId: string; contractId: string }>();
  const navigate = useNavigate();

  // Placeholder for contract data fetching
  const contract = {
    id: contractId,
    code: `CON-${contractId?.substring(0, 8).toUpperCase()}`,
    tenantName: 'Đang tải...',
    roomName: 'Đang tải...',
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    status: 'active',
  };

  const handleBack = () => {
    navigate(`/properties/${propertyId}/contracts`);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight italic uppercase tracking-tighter">
            Chi tiết Hợp đồng
          </h1>
          <p className="text-slate-500 font-bold">{contract.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              Thông tin chung
            </h3>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Khách thuê</p>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <p className="font-bold text-slate-700">{contract.tenantName}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phòng</p>
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-slate-400" />
                  <p className="font-bold text-slate-700">{contract.roomName}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ngày bắt đầu</p>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="font-bold text-slate-700">{contract.startDate}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ngày kết thúc</p>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="font-bold text-slate-700">{contract.endDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-200">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6" />
              Trạng thái
            </h3>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center">
              <p className="text-sm font-black uppercase tracking-widest">{contract.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
