import { useMyPendingContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { Loader2, FileSignature, ChevronRight, AlertCircle, Building2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function PendingContractsPage() {
  const { data: contracts, isLoading, isError } = useMyPendingContracts();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Không thể tải danh sách hợp đồng</h3>
        <p className="text-sm text-slate-500 mt-2">Đã có lỗi xảy ra, vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner ring-4 ring-indigo-500/5">
          <FileSignature className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Hợp đồng chờ ký</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">
          Vui lòng kiểm tra và xác nhận các thỏa thuận thuê phòng bên dưới.
        </p>
      </header>

      {(!contracts || contracts.length === 0) ? (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-10 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 dark:text-emerald-400 mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Hoàn hảo!</h3>
          <p className="text-sm font-bold text-slate-500 mt-2">Bạn không có hợp đồng nào đang chờ ký.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contracts.map(contract => (
            <div 
              key={contract.id}
              onClick={() => navigate(`/app/contracts/${contract.id}`)}
              className="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              <div className="flex items-center justify-between mb-4 pl-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    Chờ chữ ký
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {format(new Date(contract.created_at), 'dd/MM/yyyy')}
                </span>
              </div>
              
              <div className="pl-2 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {contract.property?.name || 'Cơ sở'} - {contract.room?.name || 'Phòng'}
                    </h4>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> ID: {contract.id.substring(0,8).toUpperCase()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors shrink-0">
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Calendar className="w-4 h-4" />
                    Bắt đầu: {contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '---'}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <span className="font-black text-indigo-600 dark:text-indigo-400">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.rent_price || 0)}
                    </span>
                    / tháng
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Ensure CheckCircle is imported. Adding it to the file via instruction.
import { CheckCircle } from 'lucide-react';
