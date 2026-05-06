import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Search,
  Wallet,
  Banknote,
  CreditCard,
  Smartphone,
  Loader2,
  Undo2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { usePayments, useRefundReceipts } from '../hooks/useFinance';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { MarkRefundPaidModal } from '../components/MarkRefundPaidModal';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';
import { PERMISSIONS } from '@/shared/features/auth/permissions';
import type { PaymentStatus, PaymentMethod, RefundReceiptRow } from '../types';
import { paymentMethodLabelVi } from '@/shared/utils/paymentMethodLabelVi';
import { paymentDetailReferrerState } from '../utils/paymentNavigation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

const methodConfig: Record<string, { label: string; icon: typeof Banknote; color: string }> = {
  CASH:          { label: 'Tiền mặt',    icon: Banknote,   color: 'text-emerald-600 dark:text-emerald-400' },
  BANK_TRANSFER: { label: 'Chuyển khoản', icon: CreditCard, color: 'text-indigo-600 dark:text-indigo-400' },
  TRANSFER:      { label: 'Chuyển khoản', icon: CreditCard, color: 'text-indigo-600 dark:text-indigo-400' },
  VNPAY:         { label: 'VNPay',       icon: Smartphone,   color: 'text-sky-600 dark:text-sky-400' },
  WALLET:        { label: 'Ví điện tử',  icon: Wallet,     color: 'text-violet-600 dark:text-violet-400' },
  QR:            { label: 'Mã QR',       icon: CreditCard, color: 'text-sky-600 dark:text-sky-400' },
};

const depositStatusLabel: Record<string, string> = {
  HELD: 'Đang giữ',
  REFUND_PENDING: 'Chờ hoàn cọc',
  REFUNDED: 'Đã hoàn trả',
  PARTIAL_REFUND: 'Hoàn 1 phần',
  FORFEITED: 'Bị phạt cọc',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PaymentsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const mainTab: 'payments' | 'refunds' = tabFromUrl === 'refunds' ? 'refunds' : 'payments';
  const focusRefundId = searchParams.get('focus');
  const setMainTab = (next: 'payments' | 'refunds') => {
    const sp = new URLSearchParams(searchParams);
    if (next === 'payments') {
      sp.delete('tab');
      sp.delete('focus');
    } else {
      sp.set('tab', next);
    }
    setSearchParams(sp, { replace: true });
  };

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [page, setPage]                 = useState(1);
  const [refundPage, setRefundPage]     = useState(1);
  const [activeRefund, setActiveRefund] = useState<RefundReceiptRow | null>(null);

  // ── Build params ─────────────────────────────────────────────────────────
  const receivedBetween = dateFrom && dateTo ? `${dateFrom},${dateTo}` : undefined;

  const params = useMemo(() => ({
    search: search || undefined,
    'filter[status]':            (statusFilter || undefined) as PaymentStatus | undefined,
    'filter[method]':            (methodFilter || undefined) as PaymentMethod | undefined,
    'filter[property_id]':       propertyId,
    'filter[received_between]':  receivedBetween,
    sort: '-received_at',
    page,
    per_page: 15,
  }), [search, statusFilter, methodFilter, propertyId, receivedBetween, page]);

  const { data, isLoading } = usePayments(params);

  const refundParams = useMemo(() => ({
    'filter[property_id]': propertyId,
    page: refundPage,
    per_page: 15,
  }), [propertyId, refundPage]);

  const { data: refundData, isLoading: refundLoading } = useRefundReceipts(refundParams, {
    enabled: mainTab === 'refunds',
  });

  const payments = data?.data ?? [];
  const meta     = data?.meta;
  const refundRows = refundData?.data ?? [];
  const refundMeta = refundData?.meta;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="p-6 md:p-8 space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Biên lai</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Lịch sử ghi nhận thanh toán của tòa nhà
            </p>
            <PermissionGate permission={PERMISSIONS.viewAnyPayment}>
              <span data-testid="rbac-permission-viewAny-payment" className="sr-only">
                RBAC hydrated: viewAny Payment
              </span>
            </PermissionGate>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex w-fit overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          {(
            [
              { id: 'payments', label: 'Thu', icon: Wallet },
              { id: 'refunds', label: 'Hoàn tiền', icon: Undo2 },
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const active = mainTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMainTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                aria-pressed={active}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {mainTab === 'payments' ? (
          <>
        {/* ── Filter Toolbar ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã giao dịch, khách trả..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Phương thức */}
            <select
              value={methodFilter}
              onChange={e => { setMethodFilter(e.target.value as PaymentMethod | ''); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 dark:text-slate-300"
            >
              <option value="">Tất cả phương thức</option>
              <option value="CASH">Tiền mặt</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
              <option value="VNPAY">VNPay</option>
            </select>

            {/* Trạng thái */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as PaymentStatus | ''); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 dark:text-slate-300"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="APPROVED">Hoàn thành</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="VOIDED">Đã hủy</option>
            </select>

            {/* Từ ngày */}
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 dark:text-slate-300"
            />

            {/* Đến ngày */}
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {/* ── Data Table ────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có biên lai nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    {['Mã GD', 'Khách trả', 'Số tiền', 'Phương thức', 'Ngày nhận', 'Người duyệt', 'Trạng thái', ''].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {payments.map(payment => {
                    const methodKey = payment.method;
                    const method = methodConfig[methodKey];
                    const MethodIcon = method?.icon ?? CreditCard;
                    const methodDisplay =
                      payment.method_label ?? method?.label ?? paymentMethodLabelVi(methodKey);
                    return (
                      <tr
                        key={payment.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        {/* Mã GD */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg">
                            #{payment.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>

                        {/* Khách trả */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {payment.payer?.full_name ?? <span className="text-slate-400 ">—</span>}
                          </span>
                        </td>

                        {/* Số tiền */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-black text-slate-900 dark:text-white">
                            {fmtVND(payment.amount)}
                          </span>
                        </td>

                        {/* Phương thức */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`flex items-center gap-1.5 ${method?.color ?? 'text-slate-500'}`}>
                            <MethodIcon className="w-4 h-4 shrink-0" />
                            <span className="font-semibold text-xs">{methodDisplay}</span>
                          </div>
                        </td>

                        {/* Ngày nhận */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 text-xs font-medium">
                          {fmtDate(payment.received_at)}
                        </td>

                        {/* Người duyệt */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                            {payment.received_by?.full_name ?? '—'}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <PaymentStatusBadge status={payment.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() =>
                              navigate(`/properties/${propertyId}/finance/payments/${payment.id}`, {
                                state: paymentDetailReferrerState(location.pathname, location.search),
                              })
                            }
                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-6 py-4 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trang <span className="font-bold text-slate-700 dark:text-slate-300">{meta.current_page}</span> / {meta.last_page}
              {' '}· Tổng <span className="font-bold text-slate-700 dark:text-slate-300">{meta.total}</span> biên lai
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
          </>
        ) : (
          <RefundsTab
            propertyId={propertyId}
            isLoading={refundLoading}
            rows={refundRows}
            meta={refundMeta}
            page={refundPage}
            setPage={setRefundPage}
            onMarkPaid={(refund: RefundReceiptRow) => setActiveRefund(refund)}
            focusId={focusRefundId}
          />
        )}
      </div>

      {activeRefund ? (
        <MarkRefundPaidModal
          refund={activeRefund}
          onClose={() => setActiveRefund(null)}
        />
      ) : null}
    </div>
  );
}

// ─── Refunds tab ──────────────────────────────────────────────────────────────

interface RefundsTabProps {
  propertyId: string | undefined;
  isLoading: boolean;
  rows: RefundReceiptRow[];
  meta?: { current_page: number; last_page: number; total: number };
  page: number;
  setPage: (updater: (p: number) => number) => void;
  onMarkPaid: (refund: RefundReceiptRow) => void;
  /** ?focus=:id từ trang Sổ cái — highlight + scroll tới row tương ứng. */
  focusId?: string | null;
}

function RefundsTab({ isLoading, rows, meta, page, setPage, onMarkPaid, focusId }: RefundsTabProps) {
  const focusedRowRef = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (!focusId || !focusedRowRef.current) return;
    focusedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, rows.length]);

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Undo2 className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có phiếu hoàn cọc nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  {['Mã', 'Phòng', 'Số tiền', 'Trạng thái cọc', 'Ngày tạo', 'Ngày chi', ''].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {rows.map(refund => {
                  const status = refund.deposit_status ?? '—';
                  const isPaid = !!refund.paid_at;
                  const isFocused = focusId && refund.id === focusId;
                  return (
                    <tr
                      key={refund.id}
                      ref={isFocused ? focusedRowRef : undefined}
                      className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                        isFocused
                          ? 'bg-indigo-50 ring-2 ring-indigo-300 dark:bg-indigo-500/10 dark:ring-indigo-500/40'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg">
                          {refund.reference ?? `#${refund.id.slice(0, 8).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                        {refund.room_name ?? refund.room_code ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-black text-slate-900 dark:text-white">
                        {fmtVND(refund.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            status === 'REFUNDED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : status === 'REFUND_PENDING'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300'
                          }`}
                        >
                          {status === 'REFUNDED' ? <Check className="h-3 w-3" /> : null}
                          {depositStatusLabel[status] ?? status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 text-xs font-medium">
                        {fmtDate(refund.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 text-xs font-medium">
                        {refund.paid_at ? fmtDate(refund.paid_at) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {isPaid && refund.pdf_url ? (
                          <a
                            href={refund.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Tải PDF
                          </a>
                        ) : (
                          <button
                            onClick={() => onMarkPaid(refund)}
                            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                          >
                            Xác nhận đã hoàn
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.last_page > 1 ? (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Trang <span className="font-bold text-slate-700 dark:text-slate-300">{meta.current_page}</span> / {meta.last_page}
            {' '}· Tổng <span className="font-bold text-slate-700 dark:text-slate-300">{meta.total}</span> phiếu
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page >= meta.last_page}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
