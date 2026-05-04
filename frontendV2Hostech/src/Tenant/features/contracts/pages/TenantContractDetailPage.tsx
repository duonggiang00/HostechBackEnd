import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { addMonths, endOfMonth, format as formatDateFns, setDate, startOfToday } from 'date-fns';
import {
  Building2,
  Calendar,
  CircleDollarSign,
  Clock3,
  FileText,
  Loader2,
  Users,
  XCircle,
  PenTool,
  Printer,
  DoorOpen,
  ArrowRightLeft,
} from 'lucide-react';
import { useContract, useContractActions, useContractStatusHistories, CONTRACT_KEY } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { contractStatusLabelVi } from '@/PropertyScope/features/contracts/utils/contractStatusLabels';
import { ContractStatusTimeline } from '@/PropertyScope/features/contracts/components/ContractStatusTimeline';
import { TenantRoomTransferModal } from '../components/TenantRoomTransferModal';
import { TenantAddRoommateModal } from '../components/TenantAddRoommateModal';
import { useInvoice } from '@/shared/features/billing/hooks/useInvoice';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import SignatureModal from '@/PropertyScope/features/contracts/components/SignatureModal';
import { ContractPreviewModal } from '@/PropertyScope/features/contracts/components/ContractPreviewModal';
import { useQueryClient } from '@tanstack/react-query';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { Button } from '@/shared/components/ui/button';
import { echo } from '@/shared/utils/echo';
import { SubmitPaymentProofModal } from '@/Tenant/features/billing/components/SubmitPaymentProofModal';
import { TenantInvoicePaymentActions } from '@/Tenant/features/billing/components/TenantInvoicePaymentActions';
import { TenantEditRoommateModal } from '../components/TenantEditRoommateModal';
import { MemberIdentityViewDialog } from '@/PropertyScope/features/contracts/components/MemberIdentityViewDialog';
import { contractInitialInvoiceAsInvoice } from '../utils/initialInvoiceForProof';
import type { ContractMember } from '@/PropertyScope/features/contracts/types';


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

/** Ngày 30 của tháng sau (nếu tháng sau không đủ 30 ngày — ví dụ tháng 2 — thì lấy ngày cuối tháng). */
function getDay30OrLastOfNextMonth(): Date {
  const now = new Date();
  const firstOfNextMonth = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), 1);
  const lastDayNext = endOfMonth(firstOfNextMonth).getDate();
  const day = Math.min(30, lastDayNext);
  return setDate(firstOfNextMonth, day);
}

function ymdLocal(d: Date): string {
  return formatDateFns(d, 'yyyy-MM-dd');
}

function startOfTodayYmd(): string {
  return ymdLocal(startOfToday());
}

function endOfCurrentMonthYmd(): string {
  return ymdLocal(endOfMonth(startOfToday()));
}

const depositStatusLabel = (raw: unknown): string => {
  const v = typeof raw === 'string' ? raw : (raw as { value?: string } | null)?.value ?? '';
  const labels: Record<string, string> = {
    UNPAID: 'Chưa đóng cọc',
    HELD: 'Đang giữ cọc',
    REFUND_PENDING: 'Chờ hoàn cọc',
    REFUNDED: 'Đã hoàn trả cọc',
    PARTIAL_REFUND: 'Hoàn cọc một phần',
    FORFEITED: 'Cọc bị khấu trừ',
  };
  return labels[v] || v || '—';
};

export default function TenantContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: contract, isLoading } = useContract(id);
  const { data: tenantStatusHistories, isLoading: isLoadingTenantHistories } = useContractStatusHistories(id);
  const queryClient = useQueryClient();
  const { signContract, rejectSignature, downloadDocument, requestTermination, requestRenewal, removeContractMember } = useContractActions();

  // Listen for real-time status updates (especially PENDING_PAYMENT)
  useEffect(() => {
    if (!id || !user?.id || !echo) return;

    const channel = echo.private(`App.Models.Org.User.${user.id}`);
    
    channel.listen('.contract.pending_payment', (data: any) => {
      console.log('[Socket] Contract moved to PENDING_PAYMENT:', data);
      if (data.id === id) {
        queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, id] });
        toast.success('Hợp đồng của bạn đã chuyển sang trạng thái chờ thanh toán!', {
          duration: 5000,
          icon: '💰',
        });
      }
    });

    return () => {
      channel.stopListening('.contract.pending_payment');
    };
  }, [id, user?.id, queryClient]);
  const { createVnpayPayment } = useInvoice();
  const [showModal, setShowModal] = useState<'reject' | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  /** Tháng sau: ngày 30 tháng sau (hoặc cuối tháng). Tháng này: chọn ngày trong tháng hiện tại, không trước hôm nay. */
  const [terminationSchedule, setTerminationSchedule] = useState<'next_month' | 'this_month'>('next_month');
  const [noticeDate, setNoticeDate] = useState('');
  const [noticeReason, setNoticeReason] = useState('');
  const [terminationWarningsOpen, setTerminationWarningsOpen] = useState(false);
  const [terminationWarnings, setTerminationWarnings] = useState<string[]>([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [roommateModalOpen, setRoommateModalOpen] = useState(false);
  const [initialProofModalOpen, setInitialProofModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ContractMember | null>(null);
  const [identityViewMember, setIdentityViewMember] = useState<ContractMember | null>(null);

  const initialInvoiceStub = useMemo(
    () => (contract ? contractInitialInvoiceAsInvoice(contract) : null),
    [contract],
  );
  const memberUserId = (m: ContractMember) => (m.user_id ?? m.user?.id ?? null);

  const handlePrintContract = async () => {
    if (!contract || !contract.id) return;
    try {
      setIsPrinting(true);
      const blob = await downloadDocument.mutateAsync(contract.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = String(contract?.document_type || 'DOCX').replace(/^\./, '').toLowerCase() || 'docx';
      const fileName = `Hop-dong-${contract?.room?.code || contract.id.substring(0, 8)}.${ext}`;
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
        <div className="mt-4">
          <PageBackButton className="text-sm font-bold" />
        </div>
      </div>
    );
  }

  const billingCycleMonths = normalizeBillingCycleMonths(contract.billing_cycle);
  const cycleRentAmount = (contract.rent_price || 0) * billingCycleMonths;
  const initialTotal = cycleRentAmount + (contract.deposit_amount || 0);
  const initialInvoiceOutstanding = contract.initial_invoice
    ? Math.max(0, (contract.initial_invoice.total_amount || 0) - (contract.initial_invoice.paid_amount || 0))
    : 0;

  const isApprovedPrimary = !!(
    user?.id &&
    contract.members?.some(
      (m) =>
        String(memberUserId(m) ?? '') === String(user.id) &&
        m.is_primary &&
        String(m.status).toUpperCase() === 'APPROVED',
    )
  );
  const currentUserMember = contract.members?.find(
    (m) =>
      String(memberUserId(m) ?? '') === String(user?.id ?? '') &&
      !m.left_at &&
      String(m.status).toUpperCase() === 'PENDING',
  ) ?? contract.members?.find(
    (m) => String(memberUserId(m) ?? '') === String(user?.id ?? '') && !m.left_at,
  );
  const currentMemberStatus = String(currentUserMember?.status || '').toUpperCase();
  const tenantAlreadySigned = Boolean(contract.meta?.tenant_signed_at || currentUserMember?.signed_at);
  const canCurrentTenantSign =
    ['DRAFT', 'PENDING_SIGNATURE'].includes(String(contract.status).toUpperCase()) &&
    !!currentUserMember &&
    ['PENDING', 'APPROVED'].includes(currentMemberStatus) &&
    !tenantAlreadySigned;

  const canTenantManageRoommates =
    isApprovedPrimary && (contract.status === 'ACTIVE' || contract.status === 'PENDING_PAYMENT');

  const tenantCanEditMember = (m: ContractMember) =>
    canTenantManageRoommates &&
    !m.is_primary &&
    !m.left_at &&
    ['APPROVED', 'PENDING'].includes(String(m.status).toUpperCase());

  const rawTransfers = Array.isArray(contract.meta?.transfer_requests) ? contract.meta.transfer_requests : [];
  const pendingTransfers = rawTransfers.filter(
    (t: { status?: string }) => (String(t?.status || 'PENDING').toUpperCase() === 'PENDING'),
  );

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
        toast.success('Đã ký hợp đồng thành công. Đang mở bản mềm đã ký...');
        setIsPreviewModalOpen(true);
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

  const openNoticeDialog = () => {
    if (!contract) return;
    setTerminationSchedule('next_month');
    setNoticeDate(ymdLocal(getDay30OrLastOfNextMonth()));
    setNoticeReason('');
    setNoticeOpen(true);
  };

  const selectTerminationNextMonth = useCallback(() => {
    setTerminationSchedule('next_month');
    setNoticeDate(ymdLocal(getDay30OrLastOfNextMonth()));
  }, []);

  const selectTerminationThisMonth = useCallback(() => {
    setTerminationSchedule('this_month');
    const minD = startOfTodayYmd();
    const maxD = endOfCurrentMonthYmd();
    setNoticeDate((prev) => {
      if (!prev || prev < minD || prev > maxD) return minD;
      return prev;
    });
  }, []);

  const handleRequestRenewal = () => {
    const currentEnd = contract.end_date ? String(contract.end_date).slice(0, 10) : '';
    const nextDate = window.prompt(
      'Nhập ngày kết thúc mới (YYYY-MM-DD). Phải sau ngày kết thúc hiện tại.',
      currentEnd || undefined,
    );
    if (!nextDate) return;

    const reason = window.prompt('Lý do đề nghị gia hạn (không bắt buộc):') ?? undefined;

    requestRenewal.mutate(
      { id: contract.id, data: { requested_end_date: nextDate, reason: reason || undefined } },
      {
        onSuccess: () => toast.success('Đã gửi yêu cầu gia hạn. Ban quản lý sẽ xem xét sớm.'),
        onError: (error: any) => {
          toast.error(error?.response?.data?.message ?? 'Không thể gửi yêu cầu gia hạn.');
        },
      },
    );
  };

  const submitNoticeOfTermination = () => {
    if (!contract?.id) return;
    if (!noticeDate) {
      toast.error('Vui lòng chọn ngày dự kiến dọn đi.');
      return;
    }

    const minThisMonth = startOfTodayYmd();
    const maxThisMonth = endOfCurrentMonthYmd();
    if (terminationSchedule === 'this_month') {
      if (noticeDate < minThisMonth || noticeDate > maxThisMonth) {
        toast.error('Ngày dọn đi phải nằm trong tháng này và không được trước hôm nay.');
        return;
      }
    }

    const contractEnd = contract.end_date ? String(contract.end_date).slice(0, 10) : null;
    if (contractEnd && noticeDate > contractEnd) {
      toast.error('Ngày dự kiến dọn đi không được sau ngày kết thúc hợp đồng.');
      return;
    }

    requestTermination.mutate(
      {
        id: contract.id,
        data: {
          expected_move_out_date: noticeDate,
          reason: noticeReason.trim() || undefined,
        },
      },
      {
        onSuccess: (res) => {
          setNoticeOpen(false);
          toast.success(res?.message || 'Đã gửi thông báo trả phòng.');
          const w = res?.warnings ?? [];
          if (w.length > 0) {
            setTerminationWarnings(w);
            setTerminationWarningsOpen(true);
          }
          queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contract.id] });
        },
        onError: (error: any) => {
          const errs = error?.response?.data?.errors;
          const msg =
            error?.response?.data?.message ||
            (errs && typeof errs === 'object'
              ? Object.values(errs)
                  .flat()
                  .filter(Boolean)
                  .join(' ')
              : null) ||
            'Không gửi được thông báo. Vui lòng thử lại.';
          toast.error(msg);
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),transparent_65%)]" />
          <div className="relative">
            <PageBackButton variant="inverse" />

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
              contract.status === 'PENDING_TERMINATION' ? 'bg-amber-500/15 text-amber-300' :
              contract.status === 'PENDING_SETTLEMENT' ? 'bg-amber-500/15 text-amber-300' :
              contract.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300' :
              'bg-slate-500/15 text-slate-300'
            }`}>
              Trạng thái hiện tại:{' '}
              {contract.status === 'PENDING_PAYMENT' ? 'chờ thanh toán' :
               contract.status === 'PENDING_SIGNATURE' ? 'chờ ký điện tử' :
               contract.status === 'PENDING_TERMINATION' ? 'đã báo trả phòng, chờ thanh lý' :
               contract.status === 'PENDING_SETTLEMENT' ? 'chờ thanh toán nợ quyết toán' :
               contract.status === 'ACTIVE' ? 'đang có hiệu lực' :
               contractStatusLabelVi(contract.status).toLowerCase()}
            </div>

            {String(contract.status).toUpperCase() === 'ENDED' &&
              (contract.deposit_amount ?? 0) > 0 && (
              <div className="mt-6 max-w-xl rounded-2xl border border-white/15 bg-white/5 p-4 text-left">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Tiền cọc sau khi kết thúc hợp đồng</p>
                <p className="mt-2 text-sm font-bold text-slate-200">
                  Trạng thái: <span className="text-indigo-200">{depositStatusLabel(contract.deposit_status)}</span>
                </p>
                {(contract.refunded_amount ?? 0) > 0 && (
                  <p className="mt-1 text-sm text-slate-300">
                    Số tiền hoàn dự kiến / đã lập phiếu:{' '}
                    <span className="font-mono font-bold text-white">{formatCurrencyVND(contract.refunded_amount ?? 0)}</span>
                  </p>
                )}
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Hiện chưa có nút xác nhận “đã nhận tiền hoàn cọc” trên ứng dụng. Khi ban quản lý chuyển khoản xong, họ cập nhật trạng thái cọc;
                  bạn có thể theo dõi mục trên hoặc liên hệ trực tiếp BQL.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Hành động chính</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {contract.status === 'PENDING_SIGNATURE' ? 'Cần ký điện tử' :
             contract.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' :
             contract.status === 'PENDING_TERMINATION' ? 'Thông báo trả phòng' :
             contract.status === 'PENDING_SETTLEMENT' ? 'Chờ quyết toán nợ' :
             'Thông tin chung'}
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
                {canCurrentTenantSign ? (
                  <button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  >
                    <PenTool className="h-5 w-5" />
                    Vẽ chữ ký xác nhận
                  </button>
                ) : (
                  <div className="rounded-[24px] bg-slate-50 p-4 text-center text-sm font-medium text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                    Bạn đã ký hoặc không nằm trong danh sách chờ ký của hợp đồng này.
                  </div>
                )}
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
                <TenantInvoicePaymentActions
                  sectionTitle="Chọn hình thức thanh toán hóa đơn đầu kỳ"
                  vnpayLabel="Thanh toán VNPay"
                  isVnpayPending={createVnpayPayment.isPending}
                  vnpayDisabled={!!contract.initial_invoice && initialInvoiceOutstanding <= 0}
                  manualDisabled={!!contract.initial_invoice && (initialInvoiceOutstanding <= 0 || !initialInvoiceStub)}
                  onVnpay={handlePayInitialInvoice}
                  onManualProof={() => setInitialProofModalOpen(true)}
                />
                <button
                  onClick={() => navigate('/app/billing')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                >
                  Xem tất cả hóa đơn
                </button>
              </>
            ) : contract.status === 'ACTIVE' ? (
              <div className="space-y-3">
                <p className="rounded-[24px] bg-slate-50 p-4 text-center text-sm font-medium text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  Hợp đồng đang có hiệu lực. Khi bạn dọn ra, hãy gửi thông báo để quản lý chuẩn bị thanh lý.
                </p>
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3.5 text-sm font-black text-indigo-800 transition-colors hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                >
                  <ArrowRightLeft className="h-5 w-5" />
                  Đề nghị chuyển phòng
                </button>
                <button
                  type="button"
                  onClick={handleRequestRenewal}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3.5 text-sm font-black text-violet-800 transition-colors hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
                >
                  <Calendar className="h-5 w-5" />
                  Đề nghị gia hạn hợp đồng
                </button>
                <button
                  type="button"
                  onClick={openNoticeDialog}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3.5 text-sm font-black text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                >
                  <DoorOpen className="h-5 w-5" />
                  Thông báo trả phòng
                </button>
              </div>
            ) : contract.status === 'PENDING_TERMINATION' ? (
              <div className="rounded-[24px] bg-amber-50 p-5 text-left dark:bg-amber-500/10">
                <p className="text-sm font-black text-amber-900 dark:text-amber-100">Đã gửi thông báo trả phòng</p>
                <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
                  Ngày dự kiến dọn đi:{' '}
                  <span className="font-black">
                    {contract.expected_move_out_date ? formatDate(contract.expected_move_out_date) : '—'}
                  </span>
                  . Quản lý sẽ liên hệ để chốt chi phí và các bước tiếp theo.
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800/50">
                <p className="text-center text-sm font-medium text-slate-500">
                  Hợp đồng này đã kết thúc hoặc hủy bỏ.
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

      {pendingTransfers.length > 0 && (
        <section className="rounded-[28px] border border-indigo-200 bg-indigo-50/90 p-6 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-300">Chuyển phòng</p>
          <h3 className="mt-2 text-lg font-black text-indigo-950 dark:text-white">Bạn có {pendingTransfers.length} đề nghị đang chờ xử lý</h3>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm font-medium text-indigo-900/90 dark:text-indigo-100">
            {pendingTransfers.map((t: { reason?: string | null }, i: number) => (
              <li key={i}>
                Đang chờ ban quản lý duyệt và thực hiện chuyển phòng.
                {t.reason ? ` Ghi chú: ${t.reason}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Thành viên hợp đồng</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Trạng thái ký điện tử</h2>
                </div>
              </div>
              {canTenantManageRoommates && (
                <button
                  type="button"
                  onClick={() => setRoommateModalOpen(true)}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-widest text-white dark:bg-white dark:text-slate-950"
                >
                  Thêm người ở cùng
                </button>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {(contract.members || []).map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-slate-50 px-4 py-4 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {member.full_name}
                      {member.is_primary ? ' (Người thuê chính)' : ''}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {member.signed_at ? `Đã ký lúc ${formatDate(member.signed_at)}` : 'Chưa ký điện tử'}
                    </p>
                    {String(member.status).toUpperCase() === 'PENDING' && (
                      <p className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-300">Chờ ban quản lý duyệt</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(member.identity_front_url || member.identity_back_url) && (
                      <button
                        type="button"
                        onClick={() => setIdentityViewMember(member)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Xem CCCD
                      </button>
                    )}
                    <span
                      className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black ${
                        member.signed_at
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      }`}
                    >
                      {member.signed_at ? 'Đã ký' : 'Chờ ký'}
                    </span>
                    {tenantCanEditMember(member) && (
                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-800 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                      >
                        Sửa
                      </button>
                    )}
                    {isApprovedPrimary &&
                      !member.is_primary &&
                      String(member.status).toUpperCase() === 'APPROVED' &&
                      !member.left_at && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Báo người "${member.full_name}" đã rời khỏi phòng? Họ sẽ được gỡ khỏi danh sách thành viên hiện tại.`,
                              )
                            ) {
                              return;
                            }
                            removeContractMember.mutate(
                              { contractId: contract.id, memberId: member.id },
                              {
                                onSuccess: () => {
                                  toast.success('Đã cập nhật.');
                                  queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contract.id] });
                                },
                                onError: (err: any) => {
                                  toast.error(err?.response?.data?.message || 'Không thực hiện được.');
                                },
                              },
                            );
                          }}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-white dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-900"
                        >
                          Báo rời phòng
                        </button>
                      )}
                  </div>
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
                  <div className="mt-4">
                    <TenantInvoicePaymentActions
                      cardSplitRow
                      sectionTitle="Chọn hình thức thanh toán"
                      vnpayLabel="VNPay"
                      manualLabel="Tiền mặt / CK"
                      isVnpayPending={createVnpayPayment.isPending}
                      manualDisabled={!initialInvoiceStub}
                      onVnpay={handlePayInitialInvoice}
                      onManualProof={() => setInitialProofModalOpen(true)}
                    />
                  </div>
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

      <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-7">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
              Tiến trình hợp đồng
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              Lịch sử trạng thái
            </h2>
          </div>
        </div>
        <div className="mt-6">
          <ContractStatusTimeline
            histories={tenantStatusHistories ?? []}
            isLoading={isLoadingTenantHistories}
            compact
          />
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
                  onClick={() => handleAction()}
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

      <AnimatePresence>
        {noticeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => !requestTermination.isPending && setNoticeOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative z-10 w-full max-w-lg rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Thông báo trả phòng
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Chọn thời điểm kết thúc: hệ thống gợi ý ngày theo lựa chọn của bạn. Quản lý sẽ nhận thông báo để chuẩn bị thanh lý.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={selectTerminationNextMonth}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    terminationSchedule === 'next_month'
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30 dark:border-indigo-400 dark:bg-indigo-500/15'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Lựa chọn 1
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">Kết thúc tháng sau</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Tự động đặt ngày dọn đi là <strong>ngày 30</strong> của{' '}
                    <strong>tháng sau</strong> (nếu tháng đó không có ngày 30 — ví dụ tháng 2 — sẽ lấy ngày cuối tháng).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={selectTerminationThisMonth}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    terminationSchedule === 'this_month'
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30 dark:border-indigo-400 dark:bg-indigo-500/15'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Lựa chọn 2
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">Kết thúc tháng này</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Bạn chọn một ngày trong <strong>tháng hiện tại</strong>; không được chọn các ngày{' '}
                    <strong>trước hôm nay</strong>.
                  </p>
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {terminationSchedule === 'next_month' ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Ngày dự kiến dọn đi (tự động)
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                      {noticeDate ? formatDate(noticeDate) : '—'}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{noticeDate}</p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="notice-move-out" className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Ngày dự kiến dọn đi (trong tháng này)
                    </label>
                    <input
                      id="notice-move-out"
                      type="date"
                      min={startOfTodayYmd()}
                      max={endOfCurrentMonthYmd()}
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Chỉ từ {formatDate(startOfTodayYmd())} đến {formatDate(endOfCurrentMonthYmd())}.
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="notice-reason" className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Lý do (tuỳ chọn)
                  </label>
                  <textarea
                    id="notice-reason"
                    value={noticeReason}
                    onChange={(e) => setNoticeReason(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Ví dụ: chuyển công tác, hết hạn hợp đồng..."
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                  type="button"
                  disabled={requestTermination.isPending}
                  onClick={submitNoticeOfTermination}
                  className="rounded-2xl font-black"
                >
                  {requestTermination.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi thông báo'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={requestTermination.isPending}
                  onClick={() => setNoticeOpen(false)}
                  className="rounded-2xl font-black"
                >
                  Huỷ
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {terminationWarningsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setTerminationWarningsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative z-10 w-full max-w-lg rounded-[32px] border border-amber-200 bg-amber-50 p-8 shadow-2xl dark:border-amber-700/60 dark:bg-amber-950/40"
            >
              <h3 className="text-xl font-black text-amber-950 dark:text-amber-100">Lưu ý quan trọng</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-medium leading-6 text-amber-900 dark:text-amber-200">
                {terminationWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <Button
                type="button"
                className="mt-8 w-full rounded-2xl font-black"
                onClick={() => setTerminationWarningsOpen(false)}
              >
                Đã hiểu
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MemberIdentityViewDialog
        open={!!identityViewMember}
        onClose={() => setIdentityViewMember(null)}
        memberName={identityViewMember?.full_name ?? ''}
        frontUrl={identityViewMember?.identity_front_url}
        backUrl={identityViewMember?.identity_back_url}
      />
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
        contract={contract}
      />

      <TenantRoomTransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        contractId={contract.id}
      />
      <TenantAddRoommateModal
        isOpen={roommateModalOpen}
        onClose={() => setRoommateModalOpen(false)}
        contractId={contract.id}
      />
      <TenantEditRoommateModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        contractId={contract.id}
        member={editingMember}
        contractStartDate={contract.start_date ? String(contract.start_date).slice(0, 10) : null}
      />

      {initialProofModalOpen && initialInvoiceStub && (
        <SubmitPaymentProofModal
          invoice={initialInvoiceStub}
          onClose={() => setInitialProofModalOpen(false)}
          onSuccess={() => {
            setInitialProofModalOpen(false);
            if (contract.id) {
              queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contract.id] });
            }
          }}
        />
      )}
    </div>
  );
}
