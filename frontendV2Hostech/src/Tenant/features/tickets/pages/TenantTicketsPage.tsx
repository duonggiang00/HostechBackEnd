import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  MessageCircle,
  Plus,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import MaintenanceReportModal from '@/shared/features/tickets/components/MaintenanceReportModal';
import { useMyContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { useTenantTicketsList } from '@/shared/features/tickets/hooks/useTenantTickets';
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from '@/PropertyScope/features/tickets/types';

const ACTIVE_LIKE = new Set([
  'ACTIVE',
  'PENDING_TERMINATION',
  'PENDING_SIGNATURE',
  'PENDING_PAYMENT',
]);

function pickContextContract(
  contracts:
    | { id: string; status: string; property_id: string; room_id: string }[]
    | undefined,
) {
  if (!contracts?.length) return null;
  return contracts.find((c) => ACTIVE_LIKE.has(c.status)) ?? contracts[0];
}

function tabBucket(status: TicketStatus): 'active' | 'completed' {
  if (status === 'DONE' || status === 'CANCELLED') return 'completed';
  return 'active';
}

const STATUS_DISPLAY: Record<
  TicketStatus,
  { icon: typeof Clock; label: string; tone: string }
> = {
  OPEN: {
    icon: Clock,
    label: 'Chờ tiếp nhận',
    tone: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10',
  },
  RECEIVED: {
    icon: Clock,
    label: 'Đã tiếp nhận',
    tone: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10',
  },
  IN_PROGRESS: {
    icon: AlertCircle,
    label: 'Đang xử lý',
    tone: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10',
  },
  WAITING_PARTS: {
    icon: AlertCircle,
    label: 'Chờ vật tư',
    tone: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10',
  },
  DONE: {
    icon: CheckCircle2,
    label: 'Hoàn tất',
    tone: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10',
  },
  CANCELLED: {
    icon: CheckCircle2,
    label: 'Đã hủy',
    tone: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
  },
};

const STATUS_FILTER_OPTIONS: TicketStatus[] = [
  'OPEN',
  'RECEIVED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'DONE',
  'CANCELLED',
];

const PRIORITY_FILTER_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Bình thường' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'URGENT', label: 'Khẩn cấp' },
];

const PRIORITY_BADGE_TONES: Record<TicketPriority, string> = {
  LOW: 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  HIGH: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  URGENT:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

function formatListDate(iso: string) {
  try {
    return format(new Date(iso), 'dd/MM/yyyy', { locale: vi });
  } catch {
    return '—';
  }
}

export default function TenantTicketsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { data: contracts, isLoading: loadingContracts } = useMyContracts();
  const context = useMemo(() => pickContextContract(contracts), [contracts]);

  const {
    data: ticketsPage,
    isLoading: loadingTickets,
    refetch,
  } = useTenantTicketsList({
    property_id: context?.property_id,
    room_id: context?.room_id,
    status: statusFilter ?? undefined,
    priority: priorityFilter || undefined,
    search: search || undefined,
    per_page: 50,
  });

  const tickets = ticketsPage?.data ?? [];
  const visibleTickets = tickets.filter((t) => tabBucket(t.status) === activeTab);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setPriorityFilter('');
    setSearch('');
    setSearchInput('');
  };

  const hasActiveFilter =
    !!statusFilter || !!priorityFilter || !!search;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <MaintenanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        propertyId={context?.property_id}
        roomId={context?.room_id}
        onSubmitted={() => refetch()}
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
              Sự cố & yêu cầu
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              Gửi mới hoặc trao đổi với ban quản lý
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Mỗi phiếu là một cuộc hội thoại 2 chiều: bạn báo sự cố, ban quản lý
              phản hồi và cập nhật tiến độ trực tiếp tại đây.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            disabled={!context?.property_id || !context?.room_id}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            Báo sự cố mới
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-3xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {[
            { key: 'active' as const, label: 'Đang xử lý' },
            { key: 'completed' as const, label: 'Đã hoàn tất' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-3xl px-5 py-3 text-sm font-black transition-colors ${
                activeTab === tab.key
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter(null)}
            className={`rounded-2xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${
              statusFilter === null
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Tất cả
          </button>
          {STATUS_FILTER_OPTIONS.map((st) => {
            const meta = STATUS_DISPLAY[st];
            return (
              <button
                key={st}
                type="button"
                onClick={() =>
                  setStatusFilter((prev) => (prev === st ? null : st))
                }
                className={`rounded-2xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${
                  statusFilter === st
                    ? `${meta.tone} border-current`
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as TicketPriority | '')
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-56"
          >
            <option value="">Tất cả mức ưu tiên</option>
            {PRIORITY_FILTER_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                Ưu tiên: {p.label}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo mô tả hoặc loại sự cố…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Tìm
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        {loadingContracts || loadingTickets ? (
          <div className="flex items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-white p-16 dark:border-slate-800 dark:bg-slate-900">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-sm font-bold text-slate-500">Đang tải…</span>
          </div>
        ) : (
          <>
            {visibleTickets.map((ticket: Ticket) => {
              const meta = STATUS_DISPLAY[ticket.status] ?? STATUS_DISPLAY.OPEN;
              const Icon = meta.icon;
              return (
                <Link
                  key={ticket.id}
                  to={`/app/tickets/${ticket.id}`}
                  className="flex w-full items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-slate-800/70"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <span>{ticket.category || 'Sự cố'}</span>
                      <span>{formatListDate(ticket.created_at)}</span>
                      <span
                        className={`rounded-2xl border px-2 py-0.5 text-[10px] ${PRIORITY_BADGE_TONES[ticket.priority]}`}
                      >
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-base font-black text-slate-950 dark:text-white">
                      {ticket.description}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`hidden rounded-2xl px-3 py-1.5 text-xs font-black sm:inline-flex ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                  </div>
                </Link>
              );
            })}

            {visibleTickets.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <MessageCircle className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <h4 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                  Chưa có mục nào ở nhóm này
                </h4>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {hasActiveFilter
                    ? 'Không có phiếu nào khớp với bộ lọc hiện tại. Hãy thử xoá bộ lọc hoặc tạo phiếu mới.'
                    : 'Khi bạn tạo phiếu mới hoặc phiếu hoàn tất, danh sách sẽ tự cập nhật tại đây.'}
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
