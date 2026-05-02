// @ts-nocheck
import { useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import InvoiceStatusBadge from '@/OrgScope/features/finance/components/InvoiceStatusBadge';
import { useInvoice, type Invoice } from '@/shared/features/billing/hooks/useInvoice';
import InvoiceDetailsModal from '@/OrgScope/features/finance/components/InvoiceDetailsModal';
import { useDashboard } from '@/shared/hooks/useDashboard';

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );
}

export default function InvoicesPage() {
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { useInvoices } = useInvoice();
  const { data: response, isLoading } = useInvoices({ status: filter !== 'all' ? filter.toUpperCase() : undefined });

  const invoices = response?.data || [];

  const d = dashData?.data;
  const role = dashData?.role;

  const revenueCurrent =
    role === 'owner' && d?.revenue
      ? (d.revenue as { current_period?: number }).current_period ?? 0
      : (d?.revenue as { total?: number } | undefined)?.total ?? 0;

  const revenueChangePct =
    role === 'owner' && d?.revenue ? (d.revenue as { change_percent?: number }).change_percent : undefined;

  const revenueChangeLabel =
    revenueChangePct != null ? `${revenueChangePct > 0 ? '+' : ''}${Number(revenueChangePct).toFixed(1)}%` : '—';

  const outstanding = d?.invoices?.outstanding_debt ?? 0;
  const contractsActive = d?.contracts?.total_active ?? 0;
  const newContractsInRange = (d?.contracts as { new_in_range?: number } | undefined)?.new_in_range;
  const contractsBadge =
    newContractsInRange != null && newContractsInRange > 0 ? `+${newContractsInRange} mới` : '—';

  const stats = [
    {
      label: 'Doanh thu (kỳ lọc)',
      value: formatVnd(revenueCurrent),
      change: revenueChangeLabel,
      icon: TrendingUp,
      iconClass: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15',
    },
    {
      label: 'Công nợ chưa thu',
      value: formatVnd(outstanding),
      change: '—',
      icon: DollarSign,
      iconClass: 'text-amber-400',
      iconBg: 'bg-amber-500/15',
    },
    {
      label: 'Hợp đồng hiệu lực',
      value: String(contractsActive),
      change: contractsBadge,
      icon: Receipt,
      iconClass: 'text-violet-400',
      iconBg: 'bg-violet-500/15',
    },
  ];

  const changeBadgeClass = (chg: string) => {
    if (chg === '—') return 'bg-white/10 text-slate-500';
    if (chg.startsWith('+')) return 'bg-emerald-500/15 text-emerald-400';
    if (chg.startsWith('-')) return 'bg-rose-500/15 text-rose-400';
    return 'bg-white/10 text-slate-400';
  };

  return (
    <div className="fade-in animate-in space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Hóa đơn & Tài chính</h1>
          <p className="mt-1 text-slate-500">Theo dõi doanh thu, hóa đơn và trạng thái thanh toán.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10">
            <Download className="h-4 w-4" />
            Xuất dữ liệu
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-95">
            Tạo hóa đơn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {dashLoading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))
          : stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-shadow hover:border-emerald-500/20"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`rounded-xl p-3 ${stat.iconBg} ${stat.iconClass}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${changeBadgeClass(stat.change)}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <h3 className="mt-1 text-2xl font-black text-white">{stat.value}</h3>
              </div>
            ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm hóa đơn, khách thuê hoặc phòng..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-500 transition-colors hover:text-emerald-400">
              <Filter className="h-4 w-4" />
            </button>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {['all', 'paid', 'unpaid'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all ${
                    filter === t ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'all' ? 'Tất cả' : t === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Hóa đơn</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Khách thuê</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Số tiền</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Ngày</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Trạng thái</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-emerald-400" />
                    Đang tải hóa đơn...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-medium text-slate-500">
                    Không tìm thấy hóa đơn nào.
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="transition-colors hover:bg-white/[0.04]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-white">{inv.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{inv.tenant?.name || 'Không xác định'}</p>
                      <p className="text-xs font-medium text-slate-500">Phòng {inv.tenant?.room || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-white">{inv.total?.toLocaleString('vi-VN') || 0}₫</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{inv.invoice_date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <InvoiceStatusBadge status={inv.status.toLowerCase()} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv.id)}
                        className="rounded-lg p-2 text-slate-500 transition-all hover:bg-emerald-500/15 hover:text-emerald-400"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Hiển thị {invoices.length} hóa đơn</p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-500 hover:bg-white/10 disabled:opacity-50"
              disabled
            >
              Trước
            </button>
            <button
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-500 hover:bg-white/10 disabled:opacity-50"
              disabled
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetailsModal invoiceId={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
}
