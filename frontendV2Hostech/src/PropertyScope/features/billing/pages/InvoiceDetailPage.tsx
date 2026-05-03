import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Zap,
  CreditCard,
  XCircle,
  ExternalLink,
  Building2,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  Ban,
  Receipt,
  Maximize2,
  Minimize2,
  Loader2,
  FileSignature,
  User,
} from 'lucide-react';
import {
  useInvoiceDetail,
  useIssueInvoice,
  useCancelInvoice,
} from '../hooks/usePropertyInvoices';
import { InvoiceStatusBadge } from '../components/InvoiceStatusBadge';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';
import type { InvoiceItem, InvoiceItemType } from '../types';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

const itemTypeLabel: Record<InvoiceItemType, { label: string; color: string }> = {
  RENT:       { label: 'Tiền phòng',   color: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' },
  SERVICE:    { label: 'Dịch vụ',      color: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' },
  ADJUSTMENT: { label: 'Điều chỉnh',   color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' },
  DEBT:       { label: 'Nợ tồn đọng', color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' },
  PENALTY:    { label: 'Phí phạt',     color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  DEPOSIT:    { label: 'Đặt cọc',      color: 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400' },
  DISCOUNT:   { label: 'Giảm giá',     color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  OTHER:      { label: 'Khác',         color: 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ItemTypeTag({ type }: { type: InvoiceItemType }) {
  const { label, color } = itemTypeLabel[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${color}`}>
      {label}
    </span>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Inline PDF Viewer ────────────────────────────────────────────────────────

function InlinePdfViewer({ url }: { url: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      {/* Viewer header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
          <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Bản mềm hóa đơn
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1e3a8a]/90 text-white rounded-lg text-xs font-black transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Mở tab mới
          </a>
        </div>
      </div>

      {/* PDF iframe */}
      <div className={`relative bg-slate-100 dark:bg-slate-900 transition-all duration-300 ${isExpanded ? 'h-[80vh]' : 'h-[600px]'}`}>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
              <p className="text-xs font-bold uppercase tracking-widest">Đang tải tài liệu...</p>
            </div>
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-0"
          title="Hóa đơn PDF"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ propertyId: string; invoiceId: string }>();
  const canIssueInvoices = useAuthStore((s) => s.hasRole(['Admin', 'Owner', 'Manager']));

  const { data: invoice, isLoading } = useInvoiceDetail(invoiceId ?? null);
  const { mutateAsync: issueInvoice, isPending: isIssuing } = useIssueInvoice(invoice?.property_id);
  const { mutateAsync: cancelInvoice, isPending: isCancelling } = useCancelInvoice(invoice?.property_id);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleIssue = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn phát hành hóa đơn này? Hóa đơn sẽ được gửi cho khách thuê.')) return;
    await issueInvoice({ id: invoiceId! });
  };

  const handleCancel = async () => {
    const note = window.prompt('Lý do hủy hóa đơn này là gì?');
    if (note === null) return;
    await cancelInvoice({ id: invoiceId!, payload: { note } });
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading || !invoice) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const periodLabel = `Tháng ${new Date(invoice.period_start).getMonth() + 1}/${new Date(invoice.period_start).getFullYear()}`;
  const periodRange = `${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)}`;

  const statusIcons: Record<string, React.ReactNode> = {
    PAID:      <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    OVERDUE:   <AlertCircle  className="w-5 h-5 text-rose-500" />,
    CANCELLED: <Ban          className="w-5 h-5 text-slate-400" />,
    DRAFT:     <FileText     className="w-5 h-5 text-slate-400" />,
    ISSUED:    <Receipt      className="w-5 h-5 text-amber-500" />,
    PARTIAL:   <CreditCard   className="w-5 h-5 text-indigo-500" />,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 min-h-screen">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

          {/* Back + Title */}
          <div className="flex items-center gap-4 min-w-0">
            <PageBackButton className="flex-shrink-0 rounded-xl px-3 py-2" />

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {statusIcons[invoice.status]}
                <h1 className="text-lg font-black text-slate-900 dark:text-white truncate">
                  Hóa đơn {periodLabel}
                </h1>
                <InvoiceStatusBadge status={invoice.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {invoice.room?.code ?? invoice.room?.name ?? '—'} · {invoice.property?.name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Nút xem hợp đồng */}
            {invoice.contract_id && (
              <Link
                to={`/properties/${invoice.property_id}/contracts/${invoice.contract_id}`}
                className="flex items-center gap-1.5 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all"
                title="Xem hợp đồng liên quan"
              >
                <FileSignature className="w-4 h-4" />
                <span className="hidden sm:inline">Hợp đồng</span>
              </Link>
            )}

            <PermissionGate role={['Owner', 'Manager', 'Staff', 'Admin']}>
              {invoice.status === 'DRAFT' && canIssueInvoices && (
                <button
                  onClick={handleIssue}
                  disabled={isIssuing}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl text-sm font-black transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  {isIssuing ? 'Xử lý...' : 'Phát hành'}
                </button>
              )}

              {['ISSUED', 'PARTIAL', 'OVERDUE'].includes(invoice.status) && invoice.debt > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Nhận tiền
                </button>
              )}

              {canIssueInvoices && ['DRAFT', 'ISSUED', 'OVERDUE'].includes(invoice.status) && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-sm font-black transition-all disabled:opacity-50"
                  title="Hủy hóa đơn"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Overview cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Info card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">Thông tin hóa đơn</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <InfoCard
                label="Kỳ thanh toán"
                value={periodLabel}
                sub={periodRange}
              />
              <InfoCard
                label="Phòng"
                value={
                  <span className="flex items-center gap-1.5">
                    <DoorOpen className="w-4 h-4 text-slate-400" />
                    {invoice.room?.code ?? invoice.room?.name ?? '—'}
                  </span>
                }
              />
              <InfoCard
                label="Tòa nhà"
                value={
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {invoice.property?.name ?? '—'}
                  </span>
                }
              />
              <InfoCard
                label="Khách thuê"
                value={
                  <span className="flex items-center gap-1.5 min-w-0">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{invoice.tenant_name ?? '—'}</span>
                  </span>
                }
              />
              <InfoCard
                label="Trạng thái thanh toán"
                value={<InvoiceStatusBadge status={invoice.status} size="md" />}
              />
              <InfoCard
                label="Hợp đồng"
                value={
                  invoice.contract_id ? (
                    <Link
                      to={`/properties/${invoice.property_id}/contracts/${invoice.contract_id}`}
                      className="inline-flex items-center gap-1.5 text-[#1E3A8A] dark:text-blue-400 hover:underline"
                    >
                      <FileSignature className="w-4 h-4" />
                      Xem hợp đồng
                    </Link>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoCard
                label="Ngày phát hành"
                value={(() => {
                  if (invoice.issue_date) return fmtDate(invoice.issue_date);
                  if (invoice.issued_at) return fmtDate(invoice.issued_at);
                  if (['ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'].includes(invoice.status) && invoice.created_at) {
                    return fmtDate(invoice.created_at);
                  }
                  return '—';
                })()}
              />
              <InfoCard
                label="Hạn thanh toán"
                value={invoice.due_date ? fmtDate(invoice.due_date) : '—'}
              />
              <InfoCard
                label="Người phát hành"
                value={invoice.issued_by?.full_name ?? 'Hệ thống'}
                sub={invoice.issued_at ? fmtDate(invoice.issued_at) : undefined}
              />
            </div>
          </div>

          {/* Financial card */}
          <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 text-white shadow-lg shadow-[#1E3A8A]/30">
            <div className="flex items-center gap-2 mb-6">
              <Receipt className="w-4 h-4 text-white/70" />
              <h2 className="text-xs font-black text-white/70 uppercase tracking-widest">Tài chính</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Tổng cộng</p>
                <p className="text-3xl font-black tracking-tight">{fmtVND(invoice.total_amount)}</p>
              </div>
              <div className="h-px bg-white/10" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-widest mb-1">Đã trả</p>
                  <p className="text-lg font-black text-emerald-400">{fmtVND(invoice.paid_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-rose-300/80 uppercase tracking-widest mb-1">Còn nợ</p>
                  <p className="text-lg font-black text-rose-400">{fmtVND(invoice.debt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── OVERDUE Banner ─────────────────────────────────────────────────── */}
        {invoice.status === 'OVERDUE' && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-rose-700 dark:text-rose-400">Hóa đơn đã quá hạn thanh toán</p>
              <p className="text-xs text-rose-500 dark:text-rose-400/80 mt-0.5">
                Hạn thanh toán: {invoice.due_date ? fmtDate(invoice.due_date) : '—'}. Vui lòng liên hệ khách thuê để giải quyết.
              </p>
            </div>
          </div>
        )}

        {/* ── Invoice Items ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <Receipt className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
            <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Chi tiết khoản phí</h2>
          </div>

          <div className="p-6">
            {(invoice.items ?? []).length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-bold">Không có khoản phí nào.</p>
              </div>
            ) : (
              <>
                {/* Header row */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2">
                  <div className="col-span-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mô tả</div>
                  <div className="col-span-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Loại</div>
                  <div className="col-span-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Đơn giá</div>
                  <div className="col-span-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">SL</div>
                  <div className="col-span-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Thành tiền</div>
                </div>

                {/* Data rows */}
                {(invoice.items ?? []).map((item: InvoiceItem) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 items-center px-4 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                  >
                    <div className="col-span-5">
                      <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                        {item.description}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <ItemTypeTag type={item.type} />
                    </div>
                    <div className="col-span-2 text-sm font-bold text-slate-600 dark:text-slate-300 text-right">
                      {fmtVND(item.unit_price)}
                    </div>
                    <div className="col-span-1 text-sm font-bold text-slate-500 dark:text-slate-400 text-center">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-sm font-black text-slate-900 dark:text-white text-right">
                      {fmtVND(item.amount)}
                    </div>
                  </div>
                ))}

                {/* Total row */}
                <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-12 gap-4 px-4">
                  <div className="col-span-10 text-sm font-black text-slate-900 dark:text-white text-right">Tổng cộng</div>
                  <div className="col-span-2 text-sm font-black text-[#1E3A8A] dark:text-blue-400 text-right">
                    {fmtVND(invoice.total_amount)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Inline PDF Viewer ─────────────────────────────────────────────── */}
        {invoice.pdf_url ? (
          <InlinePdfViewer url={invoice.pdf_url} />
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-black text-slate-400 dark:text-slate-500">Bản mềm hóa đơn chưa được tạo.</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">PDF sẽ tự động được tạo khi phát hành hóa đơn.</p>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showPaymentModal && (
        <RecordPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          invoice={invoice}
        />
      )}
    </div>
  );
}
