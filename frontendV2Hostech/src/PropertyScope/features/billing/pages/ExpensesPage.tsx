import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowDownLeft, ArrowUpRight, Plus, Search, 
  Wallet, TrendingDown, RefreshCcw, Calendar, FileText,
  Loader2, DollarSign, X, CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CashflowEntry {
  date: string;
  total_in: number;
  total_out: number;
  net: number;
}

interface CashflowSummary {
  total_in: number;
  total_out: number;
  net_cashflow: number;
  entry_count: number;
  period: { from: string | null; to: string | null };
}

interface PaymentRecord {
  id: string;
  status: string;
  method: string;
  amount: number;
  reference: string | null;
  note: string | null;
  property?: { id: string; name: string } | null;
  payer?: { id: string; full_name: string; email?: string } | null;
  received_by?: { id: string; full_name: string } | null;
  allocations?: { id: string; amount: number; invoice?: { id: string; status: string; room?: { name?: string; code?: string } } }[];
  received_at: string | null;
  approved_at: string | null;
  created_at: string;
}

interface DepositContract {
  id: string;
  room?: { id: string; name: string; code: string };
  deposit_amount: string;
  deposit_status: string;
  refunded_amount: string;
  forfeited_amount: string;
  status: string;
  start_date: string;
  end_date: string;
  members?: { full_name: string; role: string }[];
}

type TabType = 'payments' | 'expenses' | 'deposits';

// ─── API Calls ────────────────────────────────────────────────────────────────

const expensesApi = {
  getCashflow: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/finance/cashflow', { params });
    return response.data.data;
  },

  getPayments: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/finance/payments', { params });
    return response.data;
  },

  createCashflow: async (data: { type: string; amount: number; reason: string; occurred_at?: string }) => {
    const response = await apiClient.post('/finance/cashflow', data);
    return response.data;
  },

  getDepositContracts: async (propertyId: string, params?: Record<string, any>) => {
    const response = await apiClient.get(`/properties/${propertyId}/contracts`, {
      params: {
        ...params,
        'filter[deposit_status]': 'REFUND_PENDING,REFUNDED,PARTIAL_REFUND,FORFEITED',
        include: 'room,members',
        per_page: 50,
      },
    });
    return response.data;
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpensesPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('payments');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ─── Cashflow Data ───────
  const { data: cashflowData, isLoading: cashflowLoading } = useQuery({
    queryKey: ['cashflow', propertyId],
    queryFn: () => expensesApi.getCashflow({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    }),
    enabled: !!propertyId,
    staleTime: 30_000,
  });

  // ─── Payments (Phiếu thu) Data ───────
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['finance-payments', propertyId, page, search],
    queryFn: () => expensesApi.getPayments({
      'filter[property_id]': propertyId,
      page,
      per_page: 15,
      search: search || undefined,
      sort: '-received_at',
    }),
    enabled: !!propertyId,
    staleTime: 30_000,
  });

  // ─── Deposit Refund Contracts ───────
  const { data: depositData, isLoading: depositsLoading } = useQuery({
    queryKey: ['deposit-contracts', propertyId],
    queryFn: () => expensesApi.getDepositContracts(propertyId!),
    enabled: !!propertyId && activeTab === 'deposits',
    staleTime: 30_000,
  });

  // ─── Create Cashflow Mutation ───────
  const createCashflowMutation = useMutation({
    mutationFn: expensesApi.createCashflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      toast.success('Đã ghi nhận phiếu chi thành công!');
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  const summary: CashflowSummary = cashflowData?.summary ?? {
    total_in: 0, total_out: 0, net_cashflow: 0, entry_count: 0,
    period: { from: null, to: null },
  };

  const dailyData: CashflowEntry[] = cashflowData?.daily?.data ?? [];
  const payments: PaymentRecord[] = paymentsData?.data ?? [];
  const paymentsMeta = paymentsData?.meta;
  const depositContracts: DepositContract[] = depositData?.data ?? [];

  const fmtVND = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  const getMethodLabel = (method: string) => {
    const map: Record<string, string> = {
      CASH: 'Tiền mặt',
      TRANSFER: 'Chuyển khoản',
      bank_transfer: 'Chuyển khoản',
      QR: 'QR Code',
      WALLET: 'Ví điện tử',
    };
    return map[method] || method;
  };

  const getDepositStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      REFUND_PENDING: { label: 'Chờ hoàn', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      REFUNDED: { label: 'Đã hoàn', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      PARTIAL_REFUND: { label: 'Hoàn 1 phần', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      FORFEITED: { label: 'Tịch thu', className: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
      HELD: { label: 'Đang giữ', className: 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' },
    };
    const item = map[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.className}`}>
        {item.label}
      </span>
    );
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 w-full flex flex-col min-h-0 relative">
      <div className="p-6 md:p-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black bg-gradient-to-br from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  Phiếu chi & Hoàn cọc
                </h1>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Quản lý dòng tiền thu chi và hoàn cọc hợp đồng
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold shadow-lg shadow-violet-600/30 hover:shadow-violet-600/40 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Tạo phiếu chi
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-500/10 rounded-full translate-x-12 -translate-y-12 blur-3xl group-hover:bg-emerald-100 transition-all duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tổng thu tháng này</p>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 relative z-10">
              {cashflowLoading ? <span className="text-slate-300">---</span> : fmtVND(summary.total_in)}
            </h3>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 dark:bg-rose-500/10 rounded-full translate-x-12 -translate-y-12 blur-3xl group-hover:bg-rose-100 transition-all duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tổng chi tháng này</p>
              <ArrowDownLeft className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 relative z-10">
              {cashflowLoading ? <span className="text-slate-300">---</span> : fmtVND(summary.total_out)}
            </h3>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/10 rounded-full translate-x-12 -translate-y-12 blur-3xl group-hover:bg-indigo-100 transition-all duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dòng tiền ròng</p>
              <TrendingDown className={`w-4 h-4 ${summary.net_cashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
            <h3 className={`text-2xl font-black mt-2 relative z-10 ${summary.net_cashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {cashflowLoading ? <span className="text-slate-300">---</span> : fmtVND(summary.net_cashflow)}
            </h3>
          </div>
        </div>

        {/* Tab + Content */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* Tab Bar */}
          <div className="border-b border-slate-100 dark:border-slate-700/50 p-4 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto relative">
              {[
                { key: 'payments' as TabType, label: 'Phiếu thu', icon: ArrowUpRight },
                { key: 'expenses' as TabType, label: 'Phiếu chi', icon: ArrowDownLeft },
                { key: 'deposits' as TabType, label: 'Hoàn cọc', icon: RefreshCcw },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setPage(1); }}
                  className={`relative z-10 flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            {activeTab !== 'deposits' && (
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none"
                />
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-0">
            <AnimatePresence mode="wait">
              {/* ─── TAB: Phiếu thu (Payments) ─── */}
              {activeTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto"
                >
                  {paymentsLoading ? (
                    <div className="p-12 flex justify-center">
                      <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                    </div>
                  ) : payments.length > 0 ? (
                    <>
                      <table className="w-full text-left whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Ngày thu</th>
                            <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Số tiền</th>
                            <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Phương thức</th>
                            <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Người nộp</th>
                            <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Hóa đơn</th>
                            <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {p.received_at ? new Date(p.received_at).toLocaleDateString('vi-VN') : '—'}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                                  {p.received_at ? new Date(p.received_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                  +{p.amount.toLocaleString()} ₫
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold">
                                  {getMethodLabel(p.method)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                  {p.payer?.full_name || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {p.allocations && p.allocations.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {p.allocations.map((a) => (
                                      <span key={a.id} className="inline-flex items-center px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">
                                        {a.invoice?.room?.name || a.invoice?.room?.code || 'HĐ'}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                  p.status === 'APPROVED' 
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  {p.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                                  {p.status === 'APPROVED' ? 'Đã duyệt' : p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {paymentsMeta && paymentsMeta.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                          <p className="text-xs text-slate-500 font-medium">
                            Trang {paymentsMeta.current_page} / {paymentsMeta.last_page} ({paymentsMeta.total} giao dịch)
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPage(p => p - 1)}
                              disabled={page === 1}
                              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-50"
                            >
                              Trước
                            </button>
                            <button
                              onClick={() => setPage(p => p + 1)}
                              disabled={page === paymentsMeta.last_page}
                              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-50"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-16 text-center">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-500">Chưa có phiếu thu nào.</p>
                      <p className="text-sm text-slate-400 mt-1">Phiếu thu sẽ được tạo khi bạn ghi nhận thanh toán cho hóa đơn.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── TAB: Phiếu chi (Expenses) ─── */}
              {activeTab === 'expenses' && (
                <motion.div
                  key="expenses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto"
                >
                  {cashflowLoading ? (
                    <div className="p-12 flex justify-center">
                      <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                    </div>
                  ) : dailyData.length > 0 ? (
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Ngày</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Thu vào</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Chi ra</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Ròng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {dailyData.map((entry) => (
                          <tr key={entry.date} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400">
                                  <Calendar className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {new Date(entry.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {entry.total_in > 0 ? `+${entry.total_in.toLocaleString()} ₫` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                                {entry.total_out > 0 ? `-${entry.total_out.toLocaleString()} ₫` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-black ${entry.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {entry.net >= 0 ? '+' : ''}{entry.net.toLocaleString()} ₫
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-16 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-500">Chưa có dữ liệu dòng tiền tháng này.</p>
                      <p className="text-sm text-slate-400 mt-1">Nhấn "Tạo phiếu chi" để ghi nhận khoản chi mới.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── TAB: Hoàn cọc (Deposits) ─── */}
              {activeTab === 'deposits' && (
                <motion.div
                  key="deposits"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto"
                >
                  {depositsLoading ? (
                    <div className="p-12 flex justify-center">
                      <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                    </div>
                  ) : depositContracts.length > 0 ? (
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Phòng</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Cọc</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Đã hoàn</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Tịch thu</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Trạng thái cọc</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Hợp đồng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {depositContracts.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                                {c.room?.name || c.room?.code || '—'}
                              </span>
                              {c.members && c.members.length > 0 && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {c.members.find(m => m.role === 'primary')?.full_name || c.members[0]?.full_name}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                                {Number(c.deposit_amount).toLocaleString()} ₫
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {Number(c.refunded_amount).toLocaleString()} ₫
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                                {Number(c.forfeited_amount).toLocaleString()} ₫
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {getDepositStatusBadge(c.deposit_status)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                c.status === 'TERMINATED' 
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                  : c.status === 'ENDED'
                                  ? 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-16 text-center">
                      <RefreshCcw className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-500">Chưa có hợp đồng nào cần hoàn cọc.</p>
                      <p className="text-sm text-slate-400 mt-1">Các hợp đồng đã kết thúc có cọc sẽ hiển thị ở đây.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── Create Expense Modal ─── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateExpenseModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={(data) => createCashflowMutation.mutate(data)}
            isSubmitting={createCashflowMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Create Expense Modal Component ───────────────────────────────────────────

function CreateExpenseModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (data: { type: string; amount: number; reason: string; occurred_at?: string }) => void;
  isSubmitting: boolean;
}) {
  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reason) return;
    onSubmit({
      type,
      amount: parseFloat(amount),
      reason,
      occurred_at: occurredAt || undefined,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Ghi nhận thu/chi</h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Type Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại giao dịch</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('IN')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                    type === 'IN'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-2 border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 inline mr-2" />
                  Thu vào
                </button>
                <button
                  type="button"
                  onClick={() => setType('OUT')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                    type === 'OUT'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-2 border-rose-300 dark:border-rose-700'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 inline mr-2" />
                  Chi ra
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số tiền (₫)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                step="1000"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lý do / Mô tả</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Chi phí sửa điện tầng 3..."
                required
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all resize-none"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày phát sinh</label>
              <input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !amount || !reason}
                className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
