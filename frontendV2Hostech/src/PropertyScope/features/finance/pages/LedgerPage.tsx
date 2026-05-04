import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  ExternalLink,
  Landmark,
  Loader2,
  ScrollText,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import { isUuid } from '@/lib/utils';
import {
  useCashflowFeed,
  useLedgerDepositForfeitFeed,
  useLedgerSummary,
  useOutstandingInvoices,
  usePayments,
  useRefundReceipts,
} from '../hooks/useFinance';
import { useContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import type {
  CashflowFeedQueryParams,
  LedgerDepositForfeitFeedQueryParams,
  LedgerSummaryParams,
  PaymentQueryParams,
  RefundReceiptQueryParams,
} from '../types';

type LedgerTab = 'all' | 'incoming' | 'refunds' | 'forfeit_book' | 'debts' | 'deposits';

const TABS: { id: LedgerTab; label: string; icon: typeof Wallet }[] = [
  { id: 'all', label: 'Dòng tiền tất cả', icon: Wallet },
  { id: 'incoming', label: 'Tiền thu vào', icon: TrendingUp },
  { id: 'refunds', label: 'Tiền hoàn trả', icon: TrendingDown },
  { id: 'forfeit_book', label: 'Ghi nhận sổ (thu hồi cọc)', icon: ScrollText },
  { id: 'debts', label: 'Tiền nợ', icon: BookOpen },
  { id: 'deposits', label: 'Tiền cọc', icon: Landmark },
];

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso ?? '—';
  }
}

function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
}

export function LedgerPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab') ?? 'all') as LedgerTab;
  const tab: LedgerTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'all';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const switchTab = (next: LedgerTab) => {
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', next);
    setSearchParams(sp, { replace: true });
    setPage(1);
  };

  const occurredBetween = dateFrom && dateTo ? `${dateFrom},${dateTo}` : undefined;
  const createdBetween = occurredBetween;

  // KPI summary — luôn fetch
  const summaryParams = useMemo((): LedgerSummaryParams => {
    const p: LedgerSummaryParams = {};
    if (propertyId) p['filter[property_id]'] = propertyId;
    if (occurredBetween) p['filter[occurred_between]'] = occurredBetween;
    return p;
  }, [propertyId, occurredBetween]);
  const { data: summary, isLoading: summaryLoading } = useLedgerSummary(summaryParams);

  // ─── Data per tab ────────────────────────────────────────────────────────────

  const cashflowParams = useMemo((): CashflowFeedQueryParams => ({
    'filter[property_id]': propertyId || undefined,
    'filter[occurred_between]': occurredBetween,
    per_page: 20,
    page,
  }), [propertyId, occurredBetween, page]);
  const { data: cashflowData, isLoading: cashflowLoading } = useCashflowFeed(cashflowParams, {
    enabled: tab === 'all',
  });

  const forfeitBookParams = useMemo((): LedgerDepositForfeitFeedQueryParams => ({
    'filter[property_id]': propertyId || undefined,
    'filter[occurred_between]': occurredBetween,
    per_page: 20,
    page,
  }), [propertyId, occurredBetween, page]);
  const { data: forfeitBookData, isLoading: forfeitBookLoading } = useLedgerDepositForfeitFeed(forfeitBookParams, {
    enabled: tab === 'forfeit_book',
  });

  const incomingParams = useMemo((): PaymentQueryParams => ({
    'filter[property_id]': propertyId || undefined,
    'filter[status]': 'APPROVED',
    'filter[received_between]': occurredBetween,
    sort: '-received_at',
    per_page: 20,
    page,
  }), [propertyId, occurredBetween, page]);
  const { data: incomingData, isLoading: incomingLoading } = usePayments(incomingParams, {
    enabled: tab === 'incoming',
  });

  const refundParams = useMemo((): RefundReceiptQueryParams => ({
    'filter[property_id]': propertyId || undefined,
    'filter[created_between]': createdBetween,
    'filter[paid_only]': 1,
    per_page: 20,
    page,
  }), [propertyId, createdBetween, page]);
  const { data: refundData, isLoading: refundLoading } = useRefundReceipts(refundParams, {
    enabled: tab === 'refunds',
  });

  const { data: outstandingData, isLoading: outstandingLoading } = useOutstandingInvoices(
    propertyId ?? '',
    { page, per_page: 20, sort: '-due_date' },
    { enabled: tab === 'debts' && !!propertyId },
  );

  const { data: depositsData, isLoading: depositsLoading } = useContracts(
    { property_id: propertyId, status: 'ACTIVE', per_page: 100, page: 1 },
    { enabled: tab === 'deposits' && isUuid(propertyId) },
  );

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderHeaderRow = (cols: string[]) => (
    <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
      {cols.map((c) => (
        <th
          key={c}
          className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          {c}
        </th>
      ))}
    </tr>
  );

  const renderEmpty = (label: string, Icon: typeof Wallet) => (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Icon className="h-12 w-12 text-slate-300 dark:text-slate-600" />
      <p className="font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );

  const renderLoader = () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  );

  // ─── Tab content ─────────────────────────────────────────────────────────────

  const renderAllTab = () => {
    const rows = cashflowData?.data ?? [];
    if (cashflowLoading) return renderLoader();
    if (rows.length === 0) return renderEmpty('Chưa có dòng tiền nào', Wallet);
    return (
      <table className="w-full text-sm">
        <thead>{renderHeaderRow(['Loại', 'Mã biên lai', 'Giá trị', 'Thời điểm'])}</thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {rows.map((r) => {
            const isIn = r.direction === 'IN';
            return (
              <tr key={`${r.kind}-${r.id}`} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                      isIn
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                    }`}
                  >
                    {isIn ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
                    {isIn ? 'Thu vào' : 'Hoàn trả'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  {r.reference ?? shortId(r.id)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-black ${
                      isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIn ? '+' : '−'}
                    {fmtVND(r.amount)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {fmtDate(r.occurred_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderIncomingTab = () => {
    const rows = incomingData?.data ?? [];
    if (incomingLoading) return renderLoader();
    if (rows.length === 0) return renderEmpty('Chưa có biên lai thu nào', TrendingUp);
    return (
      <table className="w-full text-sm">
        <thead>{renderHeaderRow(['Mã biên lai', 'Giá trị', 'Khách trả', 'Thời điểm', 'Chi tiết'])}</thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {rows.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                {p.reference ?? shortId(p.id)}
              </td>
              <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">
                +{fmtVND(p.amount)}
              </td>
              <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                {p.payer?.full_name ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {fmtDate(p.received_at)}
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/properties/${propertyId}/finance/payments/${p.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  Chi tiết <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderRefundsTab = () => {
    const rows = refundData?.data ?? [];
    if (refundLoading) return renderLoader();
    if (rows.length === 0) return renderEmpty('Chưa có phiếu hoàn cọc đã chi nào', TrendingDown);
    return (
      <table className="w-full text-sm">
        <thead>{renderHeaderRow(['Mã biên lai', 'Giá trị', 'Trả cho khách', 'Thời điểm', 'Chi tiết'])}</thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {rows.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                {r.reference ?? shortId(r.id)}
              </td>
              <td className="px-4 py-3 font-black text-rose-600 dark:text-rose-400">
                −{fmtVND(r.amount)}
              </td>
              <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                {r.tenant_name ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {fmtDate(r.paid_at)}
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/properties/${propertyId}/finance/payments?tab=refunds&focus=${r.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  Chi tiết <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderDebtsTab = () => {
    const rows = outstandingData?.data ?? [];
    if (outstandingLoading) return renderLoader();
    if (rows.length === 0) return renderEmpty('Không có hóa đơn còn nợ', BookOpen);
    return (
      <table className="w-full text-sm">
        <thead>{renderHeaderRow(['Mã hóa đơn', 'Giá trị nợ', 'Mã hợp đồng', 'Khách nợ', 'Chi tiết'])}</thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {rows.map((inv) => (
            <tr key={inv.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                {shortId(inv.id)}
              </td>
              <td className="px-4 py-3 font-black text-amber-600 dark:text-amber-400">
                {fmtVND(inv.debt)}
              </td>
              <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                {shortId(inv.contract_id)}
              </td>
              <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                {inv.tenant_name ?? '—'}
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/properties/${propertyId}/billing/invoices/${inv.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  Chi tiết <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderForfeitBookTab = () => {
    const rows = forfeitBookData?.data ?? [];
    if (forfeitBookLoading) return renderLoader();
    if (rows.length === 0) {
      return renderEmpty('Chưa có dòng ghi nhận thu hồi cọc vào sổ', ScrollText);
    }
    return (
      <table className="w-full text-sm">
        <thead>
          {renderHeaderRow(['Mã tham chiếu', 'Số ghi nhận', 'Diễn giải', 'Hợp đồng', 'Thời điểm'])}
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {rows.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                {r.reference ?? shortId(r.ledger_entry_id)}
              </td>
              <td className="px-4 py-3">
                <span className="font-black text-indigo-600 dark:text-indigo-400">+{fmtVND(r.amount)}</span>
              </td>
              <td className="max-w-md px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                {r.description ?? '—'}
              </td>
              <td className="px-4 py-3">
                {r.contract_id && propertyId ? (
                  <Link
                    to={`/properties/${propertyId}/contracts/${r.contract_id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                  >
                    {shortId(r.contract_id)} <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {fmtDate(r.occurred_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderDepositsTab = () => {
    const allActive = depositsData?.data ?? [];
    const rows = allActive.filter((c) => Number(c.deposit_amount ?? 0) > 0);
    if (depositsLoading) return renderLoader();
    if (rows.length === 0) return renderEmpty('Không có hợp đồng đang giữ cọc', Landmark);
    return (
      <table className="w-full text-sm">
        <thead>{renderHeaderRow(['Hợp đồng', 'Khách', 'Giá trị', 'Chi tiết'])}</thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {rows.map((c) => {
            const primary = c.members?.find((m) => m.is_primary) ?? c.members?.[0];
            return (
              <tr key={c.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  {shortId(c.id)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                  {primary?.full_name ?? '—'}
                </td>
                <td className="px-4 py-3 font-black text-amber-700 dark:text-amber-300">
                  {fmtVND(Number(c.deposit_amount ?? 0))}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/properties/${propertyId}/contracts/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                  >
                    Chi tiết <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // ─── Pagination footer ───────────────────────────────────────────────────────

  const meta = (() => {
    if (tab === 'all') return cashflowData?.meta;
    if (tab === 'incoming') return incomingData?.meta;
    if (tab === 'refunds') return refundData?.meta;
    if (tab === 'forfeit_book') return forfeitBookData?.meta;
    if (tab === 'debts') return outstandingData?.meta;
    return null;
  })();

  const showFilter = tab !== 'deposits' && tab !== 'debts';

  return (
    <div className="min-h-screen flex-1 bg-slate-50 dark:bg-slate-900">
      <div className="space-y-6 p-6 md:p-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Sổ Cái</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Tổng hợp dòng tiền, công nợ, cọc đang giữ và ghi nhận sổ thu hồi cọc — 6 tab dữ liệu rõ ràng.
          </p>
        </div>

        {/* KPI boxes — luôn hiển thị */}
        {summaryLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Tổng tiền thu (vào quỹ)"
              value={summary.total_collected}
              Icon={TrendingUp}
              accent="emerald"
            />
            <KpiCard
              label="Tổng hoàn trả (đã chi)"
              value={summary.total_refunded}
              Icon={TrendingDown}
              accent="rose"
              hint="Tổng phiếu hoàn cọc đã thanh toán cho khách."
            />
            <KpiCard
              label="Tiền cọc (HĐ ACTIVE)"
              value={summary.total_deposit_held}
              Icon={Landmark}
              accent="amber"
              hint="Tự động trừ khi hợp đồng kết thúc."
            />
          </div>
        ) : null}

        {/* Tab nav */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition-all ${
                tab === id
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-600'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Filter (hide on tabs that don't need date range) */}
        {showFilter && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Khoảng ngày
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setPage(1);
                  }}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table card */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            {tab === 'all' && renderAllTab()}
            {tab === 'incoming' && renderIncomingTab()}
            {tab === 'refunds' && renderRefundsTab()}
            {tab === 'forfeit_book' && renderForfeitBookTab()}
            {tab === 'debts' && renderDebtsTab()}
            {tab === 'deposits' && renderDepositsTab()}
          </div>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trang <span className="font-bold text-slate-700 dark:text-slate-300">{meta.current_page}</span> /
              {' '}
              {meta.last_page} · Tổng{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">{meta.total}</span> dòng
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
              >
                ← Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
              >
                Sau →
              </button>
            </div>
          </div>
        )}

        {tab === 'forfeit_book' && (
          <div className="flex items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 text-xs text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-100">
            <ScrollText className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>Tiền cọc khi khách nộp</strong> không tạo dòng ở đây. Chỉ khi quyết toán thanh lý và chọn{' '}
              <strong>thu hồi phần cọc còn lại</strong> (FORFEIT), hệ thống mới ghi nhận số tiền đó vào sổ kế toán
              (không phải tiền mặt mới — khác tab Dòng tiền tất cả).
            </p>
          </div>
        )}

        {tab === 'deposits' && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <Users className="h-4 w-4" />
            Chỉ hợp đồng <strong>ACTIVE</strong> + <code>deposit_amount &gt; 0</code>. Khi hợp đồng kết thúc, tiền cọc sẽ tự trừ khỏi tổng.
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  Icon,
  accent,
  hint,
}: {
  label: string;
  value: number;
  Icon: typeof Wallet;
  accent: 'emerald' | 'rose' | 'amber';
  hint?: string;
}) {
  const accentMap = {
    emerald: {
      ring: 'ring-emerald-500/20',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      icon: 'text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    rose: {
      ring: 'ring-rose-500/20',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      icon: 'text-rose-600 dark:text-rose-400',
      text: 'text-rose-700 dark:text-rose-300',
    },
    amber: {
      ring: 'ring-amber-500/20',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      icon: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-800 dark:text-amber-200',
    },
  } as const;
  const m = accentMap[accent];
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 dark:border-slate-700 dark:bg-slate-800 ${m.ring}`}>
      <div className="mb-2 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.bg}`}>
          <Icon className={`h-4 w-4 ${m.icon}`} />
        </div>
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className={`text-xl font-black ${m.text}`}>{fmtVND(value)}</p>
      {hint && <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}
