import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Wrench,
  UserCheck,
  AlertCircle,
  MessageSquare,
  Loader2,
  Package,
  Ban,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ticketsApi } from '@/PropertyScope/features/tickets/api/ticketsApi';
import { ticketKeys } from '@/PropertyScope/features/tickets/hooks/useTickets';
import type { TicketEvent, TicketStatus } from '@/PropertyScope/features/tickets/types';

const STATUS_ORDER: TicketStatus[] = [
  'OPEN',
  'RECEIVED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'DONE',
];

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Mới tạo',
  RECEIVED: 'Đã tiếp nhận',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_PARTS: 'Chờ vật tư',
  DONE: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  CREATED: 'Tạo phiếu',
  STATUS_CHANGED: 'Đổi trạng thái',
  COMMENT: 'Ghi chú',
};

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return iso;
  }
}

interface TicketTimelineProps {
  ticketId: string;
}

export default function TicketTimeline({ ticketId }: TicketTimelineProps) {
  const { data: ticket, isLoading, isError, error } = useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => ticketsApi.getTicket(ticketId),
    enabled: !!ticketId,
    staleTime: 15_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-16">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        <p className="text-sm font-bold text-slate-400">Đang tải tiến độ…</p>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
        <p className="mt-3 text-sm font-bold text-rose-200">
          {(error as Error)?.message || 'Không tải được chi tiết phiếu.'}
        </p>
      </div>
    );
  }

  const status = ticket.status;
  const currentIdx = STATUS_ORDER.indexOf(status);
  const isCancelled = status === 'CANCELLED';

  const events: TicketEvent[] = [...(ticket.events ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const statusIcons: Record<TicketStatus, typeof Clock> = {
    OPEN: Clock,
    RECEIVED: UserCheck,
    IN_PROGRESS: Wrench,
    WAITING_PARTS: Package,
    DONE: CheckCircle2,
    CANCELLED: Ban,
  };

  return (
    <div className="max-h-[min(80vh,640px)] overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
      <div className="mb-8 flex flex-col gap-2 border-b border-white/10 pb-6">
        <h3 className="text-xl font-black tracking-tight text-white">Tiến độ xử lý</h3>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Phiếu #{ticket.id.slice(0, 8)} · {STATUS_LABELS[status]}
          {ticket.category ? ` · ${ticket.category}` : ''}
        </p>
        <p className="text-sm leading-relaxed text-slate-300">{ticket.description}</p>
      </div>

      {!isCancelled && (
        <div className="mb-10 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trạng thái</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_ORDER.map((st, idx) => {
              const Icon = statusIcons[st];
              const reached = currentIdx >= idx;
              const active = status === st;
              return (
                <div
                  key={st}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-wider ${
                    active
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : reached
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-slate-500'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {STATUS_LABELS[st]}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          <Ban className="h-6 w-6 shrink-0" />
          <span className="text-sm font-bold">Phiếu đã hủy, không còn xử lý.</span>
        </div>
      )}

      <div className="space-y-0 relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-white/10" />
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Dòng thời gian</p>
        {events.length === 0 ? (
          <p className="pl-12 text-sm text-slate-500">Chưa có sự kiện ghi nhận.</p>
        ) : (
          events.map((ev, idx) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="relative pl-14 pb-8 last:pb-0"
            >
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-slate-300 z-10">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  {EVENT_TYPE_LABELS[ev.type] || ev.type}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {formatWhen(ev.created_at)}
                </span>
              </div>
              {ev.actor?.full_name && (
                <p className="mt-1 text-[11px] font-bold text-slate-500">Bởi {ev.actor.full_name}</p>
              )}
              {ev.message && (
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{ev.message}</p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
