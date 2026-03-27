import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContract, useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { Loader2, ArrowLeft, FileText, Building2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function TenantContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(id);
  const { acceptSignature, rejectSignature } = useContractActions();
  const [showModal, setShowModal] = useState<'accept' | 'reject' | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h3 className="text-lg font-bold">Không tìm thấy hợp đồng</h3>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-500">Quay lại</button>
      </div>
    );
  }

  const formatCurrencyVND = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleAction = (action: 'accept' | 'reject') => {
    const mutation = action === 'accept' ? acceptSignature : rejectSignature;
    mutation.mutate(contract.id, {
      onSuccess: () => {
        toast.success(action === 'accept' ? 'Đã ký hợp đồng thành công!' : 'Đã từ chối hợp đồng');
        setShowModal(null);
        navigate('/app/contracts/pending', { replace: true });
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || `Có lỗi khi thực hiện thao tác.`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Chi tiết Hợp Đồng</h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            ĐANG CHỜ KÝ
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-10 translate-x-10" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cơ sở / Phòng</p>
                <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {contract.property?.name}
                </p>
                <p className="text-sm font-bold text-slate-500 mt-1">{contract.room?.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời hạn thuê</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                  {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '---'} 
                  {' - '}
                  {contract.end_date ? new Date(contract.end_date).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700/50">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Giá thuê định kỳ</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                  {formatCurrencyVND(contract.rent_price || 0).replace('₫', '')}
                </span>
                <span className="text-sm font-black text-slate-500 uppercase">VNĐ / {contract.billing_cycle === 'MONTHLY' ? 'Tháng' : 'Quý'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tiền cọc đảm bảo</p>
              <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                {formatCurrencyVND(contract.deposit_amount || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* File Section */}
        {contract.meta?.file_path && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tài liệu đính kèm</p>
            <a 
              href={contract.meta.file_path} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl hover:border-indigo-400 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Ban_Hop_Dong_Thue.pdf
                  </p>
                  <p className="text-xs font-medium text-slate-500">Click để xem chi tiết</p>
                </div>
              </div>
            </a>
          </div>
        )}

      </div>

      {/* Action Buttons */}
      {contract.status === 'PENDING_SIGNATURE' && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-50 flex gap-4 sm:relative sm:bg-transparent sm:border-none sm:p-0">
          <button 
            onClick={() => setShowModal('reject')}
            className="flex-1 py-4 px-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[1.25rem] text-sm font-black uppercase tracking-widest hover:bg-slate-50 hover:border-rose-200 hover:text-rose-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Từ chối
          </button>
          <button 
            onClick={() => setShowModal('accept')}
            className="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-[1.25rem] text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Ký Xác Nhận
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm relative z-10 text-center"
            >
              {showModal === 'accept' ? (
                <>
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Xác nhận ký tên</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8">Bằng việc xác nhận, bạn đồng ý với các điều khoản trong hợp đồng tài liệu đính kèm.</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-6">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Từ chối hợp đồng</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8">Hành động này sẽ hủy yêu cầu ký tên hiện tại.</p>
                </>
              )}
              
              <div className="flex flex-col gap-3">
                <button 
                  disabled={acceptSignature.isPending || rejectSignature.isPending}
                  onClick={() => handleAction(showModal)}
                  className={`w-full py-4 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all ${showModal === 'accept' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100 dark:shadow-none'}`}
                >
                  {(acceptSignature.isPending || rejectSignature.isPending) ? (
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  ) : 'Xác nhận'}
                </button>
                <button 
                  onClick={() => setShowModal(null)}
                  className="w-full py-4 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm font-black uppercase tracking-widest rounded-2xl transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
