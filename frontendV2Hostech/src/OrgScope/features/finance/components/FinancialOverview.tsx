import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, Loader2, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '@/shared/hooks/useDashboard';

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );
}

function shortInvCode(id: string) {
  if (!id) return '—';
  return `INV-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export default function FinancialOverview() {
  const { data: dashboard, isLoading } = useDashboard();
  const dash = dashboard?.data;
  const role = dashboard?.role;
  const inv = dash?.invoices;

  const revenueCurrent =
    role === 'owner' && dash?.revenue
      ? (dash.revenue as { current_period?: number }).current_period ?? 0
      : (dash?.revenue as { total?: number } | undefined)?.total ?? 0;

  const revenueChangePct =
    role === 'owner' && dash?.revenue
      ? (dash.revenue as { change_percent?: number }).change_percent
      : undefined;

  const outstanding = inv?.outstanding_debt ?? 0;
  const recentPaid = inv?.recent_paid ?? [];
  const trend = inv?.revenue_last_6_months ?? [];
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const revenueThisMonth =
    inv?.revenue_this_month ?? trend.find((m) => m.month_key === currentMonthKey)?.revenue ?? 0;

  const maxTrend = Math.max(1, ...trend.map((m) => m.revenue));

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Tổng doanh thu',
      value: formatVnd(revenueCurrent),
      change:
        revenueChangePct != null
          ? `${revenueChangePct > 0 ? '+' : ''}${revenueChangePct.toFixed(1)}%`
          : null,
      trend: revenueChangePct != null ? (revenueChangePct >= 0 ? 'up' : 'down') : ('up' as const),
      icon: DollarSign,
    },
    {
      label: 'Nợ tồn đọng',
      value: formatVnd(outstanding),
      change: null,
      trend: 'down' as const,
      icon: Wallet,
    },
    {
      label: 'Tiền thu tháng này',
      value: formatVnd(revenueThisMonth),
      change: null,
      trend: 'up' as const,
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 transition-colors group-hover:bg-emerald-500/20">
                <card.icon className="h-6 w-6 text-emerald-500" />
              </div>
              {card.change != null ? (
                <div
                  className={`flex items-center gap-1 text-xs font-black ${
                    card.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {card.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.change}
                </div>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {card.label === 'Tiền thu tháng này' ? 'Đã thu' : 'Kỳ lọc'}
                </span>
              )}
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 lg:rounded-[2rem]">
          <h4 className="mb-6 text-xs font-black uppercase tracking-widest text-slate-500">Thu tiền gần đây</h4>
          <div className="space-y-4">
            {recentPaid.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có hóa đơn đã thanh toán trong dữ liệu gần nhất.</p>
            ) : (
              recentPaid.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/10"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        Đã thanh toán · {shortInvCode(row.id)}
                      </p>
                      <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-500">
                        {row.counterparty_label}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-black text-emerald-400">+{formatVnd(row.paid_amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 lg:rounded-[2rem]">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Doanh thu theo tháng (đã thu)</h4>
          <p className="mb-6 mt-1 text-[11px] font-medium text-slate-600">
            Mỗi cột = tổng tiền đã thu theo tháng cập nhật hóa đơn (thanh toán), không theo kỳ cước.
          </p>
          {trend.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu biểu đồ.</p>
          ) : (
            <>
              <div className="flex h-64 items-end gap-2 px-2">
                {trend.map((m) => (
                  <div key={m.month_key} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-emerald-500/25 transition-all hover:bg-emerald-500/45"
                      style={{ height: `${Math.max(8, (m.revenue / maxTrend) * 100)}%` }}
                      title={`${m.month_key}: ${formatVnd(m.revenue)}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                {trend.map((m) => (
                  <span key={m.month_key}>{m.month_short}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
