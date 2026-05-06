import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Banknote,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  ZoomIn,
} from 'lucide-react';
import {
  usePendingPayments,
  useApprovePayment,
  useRejectPayment,
} from '@/shared/features/billing/hooks/usePaymentVerification';
import type { Payment } from '@/shared/features/billing/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  QR: 'QR Code',
  WALLET: 'Ví điện tử',
};

// ── Reject Dialog ─────────────────────────────────────────────────────────────

function RejectDialog({
  payment,
  onConfirm,
  onCancel,
  isPending,
}: {
  payment: Payment;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Từ chối bằng chứng?</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Giao dịch <span className="font-bold text-slate-700 dark:text-slate-300">{payment.id.slice(-8).toUpperCase()}</span> –{' '}
          {formatCurrency(payment.amount)}
        </p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do từ chối (bắt buộc)..."
          rows={3}
          className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Huỷ
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-2.5 text-sm font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Proof Image Lightbox ──────────────────────────────────────────────────────

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <img
        src={url}
        alt="Bằng chứng thanh toán"
        className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ── Payment Card ──────────────────────────────────────────────────────────────

function PaymentCard({
  payment,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  payment: Payment;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const invoiceCode = payment.allocations?.[0]?.invoice?.code ?? 'Không rõ';
  const payerName = payment.payer?.full_name ?? 'Không rõ';
  // proof_receipt = ảnh tenant gửi trước khi duyệt; receipt = biên lai PDF chính thức sau duyệt
  const proofUrl = payment.proof_receipt?.url ?? null;

  return (
    <>
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        {/* Proof image uploaded by tenant */}
        {proofUrl ? (
          <div className="relative">
            <img
              src={proofUrl}
              alt="Bằng chứng thanh toán"
              className="h-52 w-full object-cover"
            />
            <button
              onClick={() => setLightboxUrl(proofUrl)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow backdrop-blur-sm hover:bg-white dark:bg-slate-900/90 dark:text-slate-300"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center bg-slate-100 dark:bg-slate-800">
            <div className="text-center text-slate-400 dark:text-slate-600">
              <Eye className="mx-auto h-8 w-8" />
              <p className="mt-2 text-xs font-medium">Không có ảnh bằng chứng</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                Chờ xác nhận
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-600">{formatDate(payment.created_at)}</span>
            </div>
            <p className="mt-2 text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(payment.amount)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hóa đơn: <span className="font-bold text-slate-700 dark:text-slate-300">{invoiceCode}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/40">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phương thức</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {METHOD_LABEL[payment.method] ?? payment.method}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Người gửi</p>
              <div className="mt-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-300">{payerName}</p>
              </div>
            </div>
          </div>

          {payment.reference && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mã tham chiếu</p>
              <p className="mt-0.5 font-mono text-sm text-slate-700 dark:text-slate-300">{payment.reference}</p>
            </div>
          )}

          {payment.note && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ghi chú</p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{payment.note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onReject}
              disabled={isRejecting || isApproving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
            >
              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Từ chối
            </button>
            <button
              onClick={onApprove}
              disabled={isApproving || isRejecting}
              className="flex flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-sm font-black text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Xác nhận đã nhận tiền
            </button>
          </div>
        </div>
      </div>

      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PaymentVerificationPage() {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const [rejectTarget, setRejectTarget] = useState<Payment | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = usePendingPayments({ property_id: propertyId });

  const approved = useApprovePayment();
  const rejected = useRejectPayment();

  const payments: Payment[] = data?.data ?? [];

  const handleApprove = (payment: Payment) => {
    setProcessingId(payment.id);
    approved.mutate(
      { id: payment.id },
      {
        onSuccess: () => {
          toast.success(`Đã xác nhận thanh toán ${formatCurrency(payment.amount)}. Hóa đơn đã được cập nhật!`);
          setProcessingId(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message ?? 'Lỗi khi xác nhận. Vui lòng thử lại.');
          setProcessingId(null);
        },
      }
    );
  };

  const handleRejectConfirm = (reason: string) => {
    if (!rejectTarget) return;
    setProcessingId(rejectTarget.id);
    rejected.mutate(
      { id: rejectTarget.id, reason },
      {
        onSuccess: () => {
          toast.success('Đã từ chối bằng chứng. Tenant sẽ được thông báo.');
          setRejectTarget(null);
          setProcessingId(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message ?? 'Lỗi khi từ chối. Vui lòng thử lại.');
          setProcessingId(null);
        },
      }
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Xét duyệt thanh toán</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Các bằng chứng thanh toán (tiền mặt / chuyển khoản) do cư dân gửi lên, đang chờ xác nhận.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Chờ duyệt</p>
            <p className="mt-0.5 text-2xl font-black text-amber-800 dark:text-amber-300">{payments.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-400">Tổng giá trị</p>
            <p className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Không thể tải dữ liệu.</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-slate-300 bg-white py-24 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Không có giao dịch chờ duyệt</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Khi cư dân gửi bằng chứng thanh toán, danh sách sẽ xuất hiện ở đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                isApproving={processingId === payment.id && approved.isPending}
                isRejecting={processingId === payment.id && rejected.isPending}
                onApprove={() => handleApprove(payment)}
                onReject={() => setRejectTarget(payment)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      {rejectTarget && (
        <RejectDialog
          payment={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          isPending={rejected.isPending}
        />
      )}
    </>
  );
}
