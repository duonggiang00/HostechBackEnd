import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,

  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Users,
  XCircle,
  PenTool,
  Printer,
} from 'lucide-react';
import { useContract, useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import SignatureModal from '@/PropertyScope/features/contracts/components/SignatureModal';
import { ContractPreviewModal } from '@/PropertyScope/features/contracts/components/ContractPreviewModal';

const normalizeBillingCycleMonths = (value: string | number | null | undefined): number => {
  if (value === 'MONTHLY') return 1;
  if (value === 'QUARTERLY') return 3;
  if (value === 'SEMI_ANNUALLY') return 6;
  if (value === 'YEARLY') return 12;

  const months = Number(value);
  return Number.isFinite(months) && months > 0 ? months : 1;
};

const formatCurrencyVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('vi-VN');
};

export default function TenantContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: contract, isLoading } = useContract(id);
  const { signContract, rejectSignature, downloadDocument } = useContractActions();
  const { createVnpayPayment } = useInvoice();
  const [showModal, setShowModal] = useState<'reject' | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintContract = async () => {
    if (!contract || !contract.id) return;
    try {
      setIsPrinting(true);
      const blob = await downloadDocument.mutateAsync(contract.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Hop-dong-${contract?.room?.code || contract.id.substring(0,8)}.docx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải file hợp đồng thành công! Vui lòng mở file để in.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tải file hợp đồng.');
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không tìm thấy hợp đồng</h3>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold text-indigo-600 dark:text-indigo-300">
          Quay lại
        </button>
      </div>
    );
  }

  const billingCycleMonths = normalizeBillingCycleMonths(contract.billing_cycle);
  const cycleRentAmount = (contract.rent_price || 0) * billingCycleMonths;
  const initialTotal = cycleRentAmount + (contract.deposit_amount || 0);
  const initialInvoiceOutstanding = contract.initial_invoice
    ? Math.max(0, (contract.initial_invoice.total_amount || 0) - (contract.initial_invoice.paid_amount || 0))
    : 0;

  const handleAction = () => {
    rejectSignature.mutate(contract.id, {
      onSuccess: () => {
        setShowModal(null);
        toast.success('Đã từ chối hợp đồng.');
        navigate('/app/contracts/pending', { replace: true });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Có lỗi khi thực hiện thao tác.');
      },
    });
  };

  const handleSignConfirm = (base64Url: string) => {
    signContract.mutate({ id: contract.id, signatureDataUrl: base64Url }, {
      onSuccess: () => {
        setIsSignatureModalOpen(false);
        toast.success('Đã ký hợp đồng thành công. Hệ thống đang tiến hành cập nhật...');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Có lỗi khi thực hiện thao tác.');
      }
    });
  };

  const handlePayInitialInvoice = () => {
    if (!contract.initial_invoice) {
      toast.error('Chưa có hóa đơn đầu kỳ để thanh toán.');
      return;
    }

    if (!user?.id) {
      toast.error('Không xác định được tài khoản thanh toán hiện tại.');
      return;
    }

    if (!contract.org_id || !contract.property?.id) {
      toast.error('Thiếu thông tin cơ sở hoặc tổ chức cho thanh toán.');
      return;
    }

    if (initialInvoiceOutstanding <= 0) {
      toast.error('Hóa đơn đầu kỳ không còn số dư cần thanh toán.');
      return;
    }

    createVnpayPayment.mutate(
      {
        org_id: contract.org_id,
        property_id: contract.property.id,
        payer_user_id: user.id,
        method: 'QR',
        amount: initialInvoiceOutstanding,
        note: `Thanh toán ${contract.initial_invoice.id}`,
        allocations: [
          {
            invoice_id: contract.initial_invoice.id,
            amount: initialInvoiceOutstanding,
          },
        ],
      },
      {
        onSuccess: (response) => {
          window.location.assign(response.payment_url);
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 bg-gray-100 rounded-lg text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết hợp đồng</h1>
          <p className="text-sm text-gray-500 mt-1">Kiểm tra thông tin và hoàn tất thủ tục thuê phòng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Trạng thái hiện tại</p>
              <div className="mt-2 flex items-center gap-2">
                 <span className={`px-3 py-1.5 text-sm font-bold rounded-md uppercase tracking-wide ${
                   contract.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' :
                   contract.status === 'PENDING_SIGNATURE' ? 'bg-amber-100 text-amber-700' :
                   contract.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                   'bg-gray-100 text-gray-700'
                 }`}>
                   {contract.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' :
                    contract.status === 'PENDING_SIGNATURE' ? 'Chờ ký điện tử' :
                    contract.status === 'ACTIVE' ? 'Đang có hiệu lực' : 'Đã kết thúc'}
                 </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
              >
                <FileText className="w-4 h-4" /> Bản mềm
              </button>
              <button
                onClick={handlePrintContract}
                disabled={isPrinting}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
              >
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} 
                {isPrinting ? 'Đang tải...' : 'In ấn'}
              </button>
            </div>
          </div>

          {/* Property & Room Details */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-900">
                   <Building2 className="w-5 h-5" />
                </div>
                <div>
                   <h2 className="text-lg font-bold text-gray-900">Phòng thuê</h2>
                   <p className="text-sm font-medium text-gray-500 mt-0.5">{contract.property?.name || 'Cơ sở'} - {contract.room?.name || 'Phòng'}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                   <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thời hạn thuê</p>
                   <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                     <Clock3 className="w-4 h-4 text-gray-400" />
                     {formatDate(contract.start_date)} - {contract.end_date ? formatDate(contract.end_date) : 'Vô thời hạn'}
                   </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                   <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chu kỳ thanh toán</p>
                   <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-gray-400" />
                     {billingCycleMonths} tháng / lần
                   </p>
                </div>
             </div>
          </div>

          {/* Members */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                   <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Người thuê & Cư dân</h2>
             </div>
             
             <div className="space-y-3">
               {(contract.members || []).map((member) => (
                 <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                   <div>
                     <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                       {member.full_name} 
                       {member.is_primary && <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">Chủ hợp đồng</span>}
                     </p>
                     <p className="text-xs font-medium text-gray-500 mt-1.5">
                       {member.signed_at ? `Đã ký lúc: ${formatDate(member.signed_at)}` : 'Chưa ký điện tử'}
                     </p>
                   </div>
                   <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md w-fit ${
                     member.signed_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                   }`}>
                     {member.signed_at ? 'Đã ký' : 'Chờ ký'}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column - Actions & Finances */}
        <div className="space-y-6">
          {/* Action Box */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Hành động</h2>
            <div className="space-y-3">
               {contract.status === 'PENDING_SIGNATURE' ? (
                 <>
                   <button
                     onClick={() => setIsSignatureModalOpen(true)}
                     className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors shadow-sm"
                   >
                     <PenTool className="w-4 h-4" /> Ký điện tử
                   </button>
                   <button
                     onClick={() => setShowModal('reject')}
                     className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 border border-gray-200 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-200 transition-colors"
                   >
                     <XCircle className="w-4 h-4" /> Từ chối
                   </button>
                 </>
               ) : contract.status === 'PENDING_PAYMENT' ? (
                 <>
                   <button
                     onClick={handlePayInitialInvoice}
                     disabled={createVnpayPayment.isPending || initialInvoiceOutstanding <= 0}
                     className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                     {createVnpayPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                     Thanh toán VNPay
                   </button>
                   <button
                     onClick={() => navigate('/app/billing')}
                     className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                   >
                     Xem hóa đơn
                   </button>
                 </>
               ) : (
                 <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Không có hành động khả dụng.</p>
                 </div>
               )}
            </div>
            
            {(contract.status === 'PENDING_SIGNATURE' || contract.status === 'PENDING_PAYMENT') && (
              <div className="mt-5 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs font-medium leading-relaxed text-amber-800">
                  <span className="font-bold uppercase tracking-wider block mb-1">Lưu ý:</span> 
                  Hóa đơn đầu kỳ chỉ xuất hiện sau khi tất cả thành viên hoàn tất ký điện tử.
                </p>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                   <CircleDollarSign className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Tài chính ban đầu</h2>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Tiền thuê / tháng</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrencyVND(contract.rent_price || 0)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Tiền thuê ({billingCycleMonths} tháng)</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrencyVND(cycleRentAmount)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Tiền cọc</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrencyVND(contract.deposit_amount || 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                  <span className="text-lg font-black text-blue-900">{formatCurrencyVND(initialTotal)}</span>
                </div>
                
                {contract.initial_invoice && (
                  <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Trạng thái thanh toán</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Cần đóng:</span>
                      <span className="text-base font-bold text-red-600">{formatCurrencyVND(initialInvoiceOutstanding)}</span>
                    </div>
                  </div>
                )}
             </div>
          </div>
          
          {contract.meta?.file_path && (
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h2 className="text-lg font-bold text-gray-900 mb-4">File đính kèm</h2>
               <a
                 href={contract.meta.file_path}
                 target="_blank"
                 rel="noreferrer"
                 className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
               >
                 <FileText className="w-8 h-8 text-blue-900 group-hover:text-blue-700 transition-colors" />
                 <div>
                   <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                     {contract.meta.file_name || 'Ban_hop_dong.pdf'}
                   </p>
                   <p className="text-xs font-medium text-gray-500 mt-0.5">Nhấn để xem chi tiết</p>
                 </div>
               </a>
             </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setShowModal(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-xl"
            >
              {showModal === 'reject' && (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <XCircle className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-center text-xl font-bold text-gray-900">
                    Từ chối hợp đồng
                  </h3>
                  <p className="mt-2 text-center text-sm text-gray-500">
                    Hành động này sẽ hủy yêu cầu ký hiện tại và cần ban quản lý xử lý lại hợp đồng. Bạn có chắc chắn không?
                  </p>
                </>
              )}

              <div className="mt-8 space-y-3">
                <button
                  disabled={rejectSignature.isPending}
                  onClick={() => handleAction()}
                  className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-colors bg-red-600 hover:bg-red-700"
                >
                  {rejectSignature.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Xác nhận từ chối'
                  )}
                </button>
                <button
                  onClick={() => setShowModal(null)}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        isLoading={signContract.isPending}
        onConfirm={handleSignConfirm}
      />
      <ContractPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        contractId={id || ''}
      />
    </div>
  );
}
