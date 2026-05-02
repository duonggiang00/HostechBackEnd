import { Link, Navigate, useParams } from 'react-router-dom';
import { ClipboardList, Gauge, Ticket, ArrowRight, ClipboardCheck } from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useTickets } from '@/PropertyScope/features/tickets/hooks/useTickets';
import { usePropertyReadings } from '@/PropertyScope/features/metering/hooks/useMeters';

export default function StaffHomePage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const hasRole = useAuthStore((s) => s.hasRole);

  if (!hasRole(['Staff'])) {
    return <Navigate to={`/properties/${propertyId}/dashboard`} replace />;
  }

  const openTickets = useTickets(
    { property_id: propertyId, status: 'OPEN', per_page: 8 },
    { enabled: !!propertyId },
  );
  const draftReadings = usePropertyReadings(propertyId, { status: 'DRAFT' });

  const tickets = openTickets.data?.data ?? [];
  const draftTotal = draftReadings.data?.meta?.total ?? 0;

  const base = `/properties/${propertyId}`;

  return (
    <div className="max-w-[1100px] mx-auto w-full p-6 space-y-8">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Tác vụ hôm nay</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ticket đang mở, chỉ số nháp và các việc vận hành nhanh.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to={`${base}/tickets`}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {openTickets.data?.meta.total ?? '—'}
            </span>
          </div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Ticket OPEN</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
            Xem danh sách <ArrowRight className="w-4 h-4" />
          </p>
        </Link>

        <Link
          to={`${base}/meters/history`}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600">
              <Gauge className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{draftTotal}</span>
          </div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Chỉ số nháp (DRAFT)</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
            Lịch sử chốt số <ArrowRight className="w-4 h-4" />
          </p>
        </Link>

        <Link
          to={`${base}/handovers`}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <ClipboardList className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Biên bản</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
            Biên bản bàn giao phòng <ArrowRight className="w-4 h-4" />
          </p>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Ticket đang mở (mẫu 8)</h2>
          <Link to={`${base}/tickets`} className="text-xs font-bold text-indigo-600 hover:underline">
            Tất cả
          </Link>
        </div>
        {openTickets.isLoading ? (
          <p className="text-sm text-slate-400">Đang tải…</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-slate-500">Không có ticket OPEN.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {tickets.map((t) => (
              <li key={t.id} className="py-3">
                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{t.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.room?.code ?? '—'} · {t.priority}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
