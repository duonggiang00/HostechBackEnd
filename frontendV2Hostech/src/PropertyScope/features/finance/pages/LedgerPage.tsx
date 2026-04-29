import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, BookOpen, TrendingUp, TrendingDown, Landmark, Wallet, Layers, Undo2 } from 'lucide-react';
import { useLedger, useLedgerSummary, useRefundReceipts } from '../hooks/useFinance';
import type { LedgerQueryParams, LedgerSummaryParams, RefundReceiptQueryParams } from '../types';

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

const refTypeLabel: Record<string, { label: string; color: string }> = {
  payment: { label: 'Thu tiền', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  payment_reversal: { label: 'Hoàn tiền', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' },
  cashflow_manual: { label: 'Quỹ (thủ công)', color: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400' },
  termination_deposit_allocation: { label: 'Cấn trừ cọc', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300' },
};

const depositStatusLabel: Record<string, string> = {
  PENDING: 'Chờ giữ cọc',
  HELD: 'Đang giữ cọc',
  REFUND_PENDING: 'Chờ hoàn cọc',
  REFUNDED: 'Đã hoàn cọc',
  PARTIAL_REFUND: 'Hoàn một phần',
  FORFEITED: 'Đã phạt cọc',
};

type MainTab = 'cashflow' | 'full' | 'refunds';

export function LedgerPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [mainTab, setMainTab] = useState<MainTab>('cashflow');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refType, setRefType] = useState('');
  const [page, setPage] = useState(1);
  const [refundPage, setRefundPage] = useState(1);

  const occurredBetween = dateFrom && dateTo ? `${dateFrom},${dateTo}` : undefined;
  const createdBetween = dateFrom && dateTo ? `${dateFrom},${dateTo}` : undefined;

  const summaryParams = useMemo((): LedgerSummaryParams => {
    const p: LedgerSummaryParams = {};
    if (propertyId) {
      p['filter[property_id]'] = propertyId;
    }
    if (occurredBetween) {
      p['filter[occurred_between]'] = occurredBetween;
    }
    return p;
  }, [propertyId, occurredBetween]);

  const ledgerParams = useMemo((): LedgerQueryParams => ({
    'filter[ref_type]': refType || undefined,
    'filter[property_id]': propertyId || undefined,
    'filter[occurred_between]': occurredBetween,
    'filter[view]': mainTab === 'full' ? 'full' : 'cashflow',
    sort: '-occurred_at',
    per_page: 20,
    page,
  }), [refType, propertyId, occurredBetween, page, mainTab]);

  const refundParams = useMemo((): RefundReceiptQueryParams => ({
    'filter[property_id]': propertyId || undefined,
    'filter[created_between]': createdBetween,
    per_page: 20,
    page: refundPage,
  }), [propertyId, createdBetween, refundPage]);

  const isLedgerTab = mainTab === 'cashflow' || mainTab === 'full';

  const { data, isLoading } = useLedger(ledgerParams, { enabled: isLedgerTab });
  const { data: summary, isLoading: summaryLoading } = useLedgerSummary(summaryParams);
  const { data: refundData, isLoading: refundLoading } = useRefundReceipts(refundParams, {
    enabled: mainTab === 'refunds',
  });

  const entries = data?.data ?? [];
  const meta = data?.meta;
  const refundRows = refundData?.data ?? [];
  const refundMeta = refundData?.meta;

  const tabBtn = (id: MainTab, label: string, Icon: typeof Wallet) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setMainTab(id);
        if (id === 'refunds') {
          setRefundPage(1);
        } else {
          setPage(1);
        }
      }}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${
        mainTab === id
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="p-6 md:p-8 space-y-6">

        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sổ Cái</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Lịch sử bút toán và dòng tiền — đối soát tài chính
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabBtn('cashflow', 'Dòng tiền', Wallet)}
          {tabBtn('full', 'Đầy đủ kép', Layers)}
          {tabBtn('refunds', 'Hoàn cọc', Undo2)}
        </div>

        {isLedgerTab && mainTab === 'cashflow' && (
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            Chỉ hiển thị tiền vào/ra quỹ (nhánh tiền mặt). Mỗi biên lai thu thường tương ứng một dòng — không hiện dòng trừ công nợ (A/R).
          </p>
        )}
        {isLedgerTab && mainTab === 'full' && (
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            Hiển thị đầy đủ kế toán kép: cùng một mã tham chiếu có thể có 2 dòng (tiền mặt + công nợ).
          </p>
        )}
        {mainTab === 'refunds' && (
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            Phiếu hoàn cọc sau thanh lý hợp đồng (theo dữ liệu RefundReceipt). Trạng thái cọc lấy từ hợp đồng tại thời điểm xem.
          </p>
        )}

        {summaryLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : summary ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hai chỉ số đầu lọc theo ngày (nếu chọn). Cọc đang giữ là tổng theo hợp đồng hiện tại, không lọc theo khoảng ngày.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Tổng tiền thu (vào quỹ)', value: summary.total_collected, icon: TrendingUp, ring: 'ring-emerald-500/20', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', iconText: 'text-emerald-600 dark:text-emerald-400', valueText: 'text-emerald-700 dark:text-emerald-300' },
                { label: 'Tổng đã hoàn trả', value: summary.total_refunded, icon: TrendingDown, ring: 'ring-rose-500/20', iconBg: 'bg-rose-50 dark:bg-rose-500/10', iconText: 'text-rose-600 dark:text-rose-400', valueText: 'text-rose-700 dark:text-rose-300' },
                { label: 'Tổng cọc đang giữ', value: summary.total_deposit_held, icon: Landmark, ring: 'ring-amber-500/20', iconBg: 'bg-amber-50 dark:bg-amber-500/10', iconText: 'text-amber-600 dark:text-amber-400', valueText: 'text-amber-800 dark:text-amber-200' },
              ].map(card => (
                <div key={card.label} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm ring-1 ${card.ring}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                      <card.icon className={`w-4 h-4 ${card.iconText}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{card.label}</span>
                  </div>
                  <p className={`text-xl font-black ${card.valueText}`}>
                    {fmtVND(card.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {isLedgerTab && (
              <select
                value={refType}
                onChange={e => { setRefType(e.target.value); setPage(1); }}
                className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 dark:text-slate-300"
              >
                <option value="">Tất cả loại bút toán</option>
                <option value="payment">Thu tiền</option>
                <option value="payment_reversal">Hoàn tiền</option>
              </select>
            )}
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); setRefundPage(1); }}
              className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-300"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); setRefundPage(1); }}
              className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {isLedgerTab && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có bút toán nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      {['Loại bút toán', 'Mã tham chiếu', 'Debit', 'Credit', 'Thời điểm'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {entries.map(entry => {
                      const typeConfig = refTypeLabel[entry.ref_type] ?? { label: entry.ref_type, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full text-[10px] font-black uppercase tracking-wider px-2 py-0.5 ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                              {entry.ref_id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              {entry.debit > 0 ? `+${fmtVND(entry.debit)}` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-black text-rose-600 dark:text-rose-400">
                              {entry.credit > 0 ? `-${fmtVND(entry.credit)}` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
                            {fmtDate(entry.occurred_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {mainTab === 'refunds' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {refundLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : refundRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Undo2 className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có phiếu hoàn cọc nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      {['Mã phiếu', 'Số tiền', 'Phòng', 'Trạng thái cọc (HĐ)', 'Đã hoàn (HĐ)', 'Ngày tạo'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {refundRows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {row.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 font-black text-indigo-600 dark:text-indigo-400">
                          {fmtVND(row.amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                          {row.room_name || row.room_id?.slice(0, 8) || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {row.deposit_status ? (depositStatusLabel[row.deposit_status] ?? row.deposit_status) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                          {row.refunded_amount != null ? fmtVND(row.refunded_amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {fmtDate(row.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {isLedgerTab && meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-6 py-4 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trang <span className="font-bold text-slate-700 dark:text-slate-300">{meta.current_page}</span> / {meta.last_page}
              {' '}· Tổng <span className="font-bold text-slate-700 dark:text-slate-300">{meta.total}</span> bút toán
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
          </div>
        )}

        {mainTab === 'refunds' && refundMeta && refundMeta.last_page > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-6 py-4 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trang <span className="font-bold text-slate-700 dark:text-slate-300">{refundMeta.current_page}</span> / {refundMeta.last_page}
              {' '}· Tổng <span className="font-bold text-slate-700 dark:text-slate-300">{refundMeta.total}</span> phiếu
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRefundPage(p => Math.max(1, p - 1))}
                disabled={refundPage <= 1}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>
              <button
                type="button"
                onClick={() => setRefundPage(p => Math.min(refundMeta.last_page, p + 1))}
                disabled={refundPage >= refundMeta.last_page}
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
