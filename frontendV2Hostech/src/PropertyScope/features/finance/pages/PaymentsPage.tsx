import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Wallet,
  Banknote,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { usePayments } from '../hooks/useFinance';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';
import { PERMISSIONS } from '@/shared/features/auth/permissions';
import type { PaymentStatus, PaymentMethod } from '../types';

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
  WALLET:        { label: 'Ví điện tử',  icon: Wallet,     color: 'text-violet-600 dark:text-violet-400' },
  QR:            { label: 'QR Code',     icon: CreditCard, color: 'text-sky-600 dark:text-sky-400' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PaymentsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [page, setPage]                 = useState(1);

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

  const payments = data?.data ?? [];
  const meta     = data?.meta;

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
              <option value="WALLET">Ví điện tử</option>
              <option value="QR">QR Code</option>
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
                    const method = methodConfig[payment.method];
                    const MethodIcon = method?.icon ?? CreditCard;
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
                            <span className="font-semibold text-xs">{method?.label ?? payment.method}</span>
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
                            onClick={() => navigate(`/properties/${propertyId}/finance/payments/${payment.id}`)}
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
      </div>

    </div>
  );
}
