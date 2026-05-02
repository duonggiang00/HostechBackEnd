import { useState } from 'react';
import { Ticket, Plus, Search, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import TicketStatusBadge from '../components/TicketStatusBadge';
import TicketPriorityBadge from '../components/TicketPriorityBadge';
import TicketDetailPanel from '../components/TicketDetailPanel';
import TicketForm from '../components/TicketForm';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';
import { PERMISSIONS } from '@/shared/features/auth/permissions';
import type { TicketStatus, TicketQueryParams } from '../types';

const STATUS_FILTERS: { value: TicketStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Mở' },
  { value: 'RECEIVED', label: 'Đã nhận' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'WAITING_PARTS', label: 'Chờ linh kiện' },
  { value: 'DONE', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

export default function TicketListPage() {
  const { propertyId } = useParams<{ propertyId: string }>();

  const [params, setParams] = useState<TicketQueryParams>({
    property_id: propertyId,
    page: 1,
    per_page: 15,
    sort: '-created_at',
  });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, refetch } = useTickets({ ...params, search: search || undefined });

  const tickets = data?.data ?? [];
  const meta = data?.meta;

  const setStatus = (status: TicketStatus | 'ALL') => {
    setParams(p => ({ ...p, status: status === 'ALL' ? undefined : status, page: 1 }));
  };

  return (
    <div className="min-h-screen pb-12">
      <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Danh sách sự cố
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {meta != null
              ? `${meta.total} phiếu · sắp xếp theo ngày tạo (mới nhất trước)`
              : 'Theo dõi và xử lý báo cáo từ khách thuê · mới nhất trước'}
          </p>
        </div>
        <PermissionGate permission={PERMISSIONS.createTicket} role={['Owner', 'Manager', 'Staff']}>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tạo phiếu
          </button>
        </PermissionGate>
      </header>

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setParams(p => ({ ...p, page: 1 }));
            }}
            placeholder="Tìm theo mô tả, phòng, người báo cáo…"
            className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Lọc trạng thái">
          {STATUS_FILTERS.map(f => {
            const active = (params.status ?? 'ALL') === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(f.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" aria-label="Đang tải" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Ticket className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Không có phiếu nào khớp bộ lọc.</p>
          </div>
        ) : (
          <>
            {/* Desktop: bảng */}
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="whitespace-nowrap px-4 py-3">Phòng</th>
                    <th className="whitespace-nowrap px-4 py-3">Ngày tạo</th>
                    <th className="whitespace-nowrap px-4 py-3">Trạng thái</th>
                    <th className="whitespace-nowrap px-4 py-3">Mức độ</th>
                    <th className="min-w-[200px] px-4 py-3">Nội dung</th>
                    <th className="whitespace-nowrap px-4 py-3">Báo cáo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.map(ticket => (
                    <tr
                      key={ticket.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      onClick={() => setSelectedId(ticket.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {ticket.room?.code ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(ticket.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <TicketStatusBadge status={ticket.status} size="sm" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <TicketPriorityBadge priority={ticket.priority} size="sm" />
                      </td>
                      <td className="max-w-md px-4 py-3">
                        <p className="line-clamp-2 font-medium text-slate-900 dark:text-slate-100">{ticket.description}</p>
                        {ticket.category && (
                          <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {ticket.category}
                          </span>
                        )}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-slate-600 dark:text-slate-400" title={ticket.created_by?.full_name}>
                        {ticket.created_by?.full_name ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: danh sách dạng dòng */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {tickets.map(ticket => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div
                    className={`mt-1 h-9 w-1 shrink-0 rounded-full ${
                      ticket.priority === 'URGENT'
                        ? 'bg-rose-500'
                        : ticket.priority === 'HIGH'
                          ? 'bg-amber-500'
                          : ticket.priority === 'MEDIUM'
                            ? 'bg-blue-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Phòng <span className="text-slate-900 dark:text-white">{ticket.room?.code ?? '—'}</span>
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                      {formatDate(ticket.created_at)}
                    </p>
                    <div className="mb-1 mt-2 flex flex-wrap items-center gap-1.5">
                      <TicketStatusBadge status={ticket.status} size="sm" />
                      <TicketPriorityBadge priority={ticket.priority} size="sm" />
                      {ticket.category && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {ticket.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{ticket.description}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ticket.created_by?.full_name ?? '—'}</p>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                </button>
              ))}
            </div>
          </>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Trang {meta.current_page} / {meta.last_page} · {meta.total} phiếu
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) - 1 }))}
                className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) + 1 }))}
                className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedId && <TicketDetailPanel ticketId={selectedId} onClose={() => setSelectedId(null)} />}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="ticket-create-title">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Đóng"
            onClick={() => setShowCreate(false)}
          />
          <div
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:rounded-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h2 id="ticket-create-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Tạo phiếu sự cố
              </h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <TicketForm
                propertyId={propertyId!}
                onSuccess={() => {
                  setShowCreate(false);
                  refetch();
                }}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
