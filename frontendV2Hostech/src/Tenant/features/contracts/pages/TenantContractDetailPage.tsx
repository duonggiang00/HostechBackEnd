import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
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
  const { signContract, acceptSignature, rejectSignature, downloadDocument } = useContractActions();
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

  const handleAction = (action: 'reject') => {
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
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.35),_transparent_65%)]" />
          <div className="relative">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-slate-400">Chi tiết hợp đồng</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">
              Kiểm tra kỹ nội dung trước khi ký điện tử.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Sau khi hợp đồng được ký đầy đủ, hóa đơn đầu kỳ sẽ xuất hiện ngay tại đây để bạn tiếp tục thanh toán qua VNPay.
            </p>

            <div className={`mt-7 inline-flex rounded-2xl px-4 py-2 text-sm font-black ${
              contract.status === 'PENDING_PAYMENT' ? 'bg-amber-500/15 text-amber-300' :
              contract.status === 'PENDING_SIGNATURE' ? 'bg-amber-500/15 text-amber-300' :
              contract.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300' :
              'bg-slate-500/15 text-slate-300'
            }`}>
              Trạng thái hiện tại:{' '}
              {contract.status === 'PENDING_PAYMENT' ? 'chờ thanh toán' :
               contract.status === 'PENDING_SIGNATURE' ? 'chờ ký điện tử' :
               contract.status === 'ACTIVE' ? 'đang có hiệu lực' : 'đã kết thúc'}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Hành động chính</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {contract.status === 'PENDING_SIGNATURE' ? 'Cần ký điện tử' : 
             contract.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : 'Thông tin chung'}
          </h2>

          <div className="mt-6 space-y-3">
            <button
               onClick={() => setIsPreviewModalOpen(true)}
               className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-5 py-3.5 text-sm font-black text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
            >
              <FileText className="h-5 w-5" />
              Xem bản mềm Hợp đồng
            </button>
            <button
               onClick={handlePrintContract}
               disabled={isPrinting}
               className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {isPrinting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
              {isPrinting ? 'Đang tải về...' : 'Tải file / In ấn'}
            </button>
            
            <div className="my-4 h-px w-full bg-slate-200 dark:bg-slate-800" />

            {contract.status === 'PENDING_SIGNATURE' ? (
              <>
                <button
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <PenTool className="h-5 w-5" />
                  Vẽ chữ ký xác nhận
                </button>
                <button
                  onClick={() => setShowModal('reject')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition-colors hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-rose-500 dark:hover:text-rose-300"
                >
                  <XCircle className="h-5 w-5" />
                  Từ chối hợp đồng
                </button>
              </>
            ) : contract.status === 'PENDING_PAYMENT' ? (
              <>
                <button
                  onClick={handlePayInitialInvoice}
                  disabled={createVnpayPayment.isPending || initialInvoiceOutstanding <= 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {createVnpayPayment.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                  {createVnpayPayment.isPending ? 'Đang chuyển sang VNPay' : 'Thanh toán VNPay'}
                </button>
                <button
                  onClick={() => navigate('/app/billing')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                >
                  Xem tất cả hóa đơn
                </button>
              </>
            ) : (
              <div className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800/50">
                 <p className="text-center text-sm font-medium text-slate-500">
                   {contract.status === 'ACTIVE' ? 'Hợp đồng này đang có hiệu lực.' : 'Hợp đồng này đã kết thúc hoặc hủy bỏ.'}
                 </p>
              </div>
            )}
          </div>

          {(contract.status === 'PENDING_SIGNATURE' || contract.status === 'PENDING_PAYMENT') && (
            <div className="mt-6 rounded-[24px] bg-amber-50 p-5 dark:bg-amber-500/10">
              <p className="text-sm font-black text-amber-800 dark:text-amber-200">Lưu ý nghiệp vụ</p>
              <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-300">
                Hóa đơn đầu kỳ chỉ xuất hiện khi tất cả thành viên trong hợp đồng đã hoàn tất ký điện tử.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Phòng thuê</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {contract.property?.name || 'Cơ sở'} - {contract.room?.name || 'Phòng'}
              </h2>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Thời hạn thuê</p>
              <p className="mt-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <Clock3 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                {formatDate(contract.start_date)} - {contract.end_date ? formatDate(contract.end_date) : 'Vô thời hạn'}
              </p>
            </div>

            <div className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Chu kỳ thanh toán</p>
              <p className="mt-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                {billingCycleMonths} tháng
              </p>
            </div>
          </div>

          {contract.meta?.file_path && (
            <div className="mt-7 rounded-[26px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">File scan hợp đồng</p>
              <a
                href={contract.meta.file_path}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-500"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {contract.meta.file_name || 'Ban_hop_dong_thue.pdf'}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Mở để xem nội dung scan chi tiết</p>
                  </div>
                </div>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">Xem file</span>
              </a>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Giá thuê và thanh toán</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Chi tiết tiền ban đầu</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Tiền thuê hàng tháng</p>
                <p className="mt-2 text-xl font-black text-indigo-600 dark:text-indigo-300">
                  {formatCurrencyVND(contract.rent_price || 0)}
                </p>
              </div>

              <div className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Tiền thuê theo chu kỳ</p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrencyVND(contract.rent_price || 0)} x {billingCycleMonths} tháng = {formatCurrencyVND(cycleRentAmount)}
                </p>
              </div>

              <div className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Tiền cọc</p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrencyVND(contract.deposit_amount || 0)}
                </p>
              </div>

              <div className="rounded-[24px] bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300 dark:text-slate-500">Tổng tiền ban đầu</p>
                <p className="mt-2 text-xl font-black">{formatCurrencyVND(initialTotal)}</p>
                <p className="mt-2 text-sm text-slate-300 dark:text-slate-600">
                  Bao gồm tiền thuê phòng hàng tháng x số tháng + tiền cọc.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Thành viên hợp đồng</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Trạng thái ký điện tử</h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {(contract.members || []).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-[24px] bg-slate-50 px-4 py-4 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {member.full_name}
                      {member.is_primary ? ' (Người thuê chính)' : ''}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {member.signed_at ? `Đã ký lúc ${formatDate(member.signed_at)}` : 'Chưa ký điện tử'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black ${
                      member.signed_at
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                    }`}
                  >
                    {member.signed_at ? 'Đã ký' : 'Chờ ký'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Thanh toán đầu kỳ</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Trạng thái hóa đơn</h2>

            {contract.initial_invoice ? (
              <div className="mt-5 rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  Số tiền cần thanh toán: {formatCurrencyVND(initialInvoiceOutstanding)}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Hạn thanh toán: {formatDate(contract.initial_invoice.due_date)}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Trạng thái hóa đơn: {contract.initial_invoice.status}
                </p>
                {contract.status === 'PENDING_PAYMENT' && initialInvoiceOutstanding > 0 && (
                  <button
                    onClick={handlePayInitialInvoice}
                    disabled={createVnpayPayment.isPending}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {createVnpayPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {createVnpayPayment.isPending ? 'Đang chuyển sang VNPay' : 'Thanh toán VNPay'}
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Hóa đơn đầu kỳ sẽ được tạo sau khi tất cả thành viên trong hợp đồng hoàn tất ký điện tử.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setShowModal(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative z-10 w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              {showModal === 'reject' && (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                    <XCircle className="h-10 w-10" />
                  </div>
                  <h3 className="mt-6 text-center text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    Từ chối hợp đồng
                  </h3>
                  <p className="mt-3 text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Hành động này sẽ hủy yêu cầu ký hiện tại và cần ban quản lý xử lý lại hợp đồng.
                  </p>
                </>
              )}

              <div className="mt-8 space-y-3">
                <button
                  disabled={rejectSignature.isPending}
                  onClick={() => handleAction('reject')}
                  className="inline-flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-black text-white transition-colors bg-rose-600 hover:bg-rose-700"
                >
                  {rejectSignature.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Xác nhận'
                  )}
                </button>
                <button
                  onClick={() => setShowModal(null)}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
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
