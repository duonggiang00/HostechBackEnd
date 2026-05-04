import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';
import TicketTimeline from '@/shared/features/tickets/components/TicketTimeline';
import MaintenanceReportModal from '@/shared/features/tickets/components/MaintenanceReportModal';
import { useTenantTicketDetail } from '@/shared/features/tickets/hooks/useTenantTickets';
import { useMyContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import type {
  TicketPriority,
  TicketStatus,
} from '@/PropertyScope/features/tickets/types';

const ACTIVE_LIKE = new Set([
  'ACTIVE',
  'PENDING_TERMINATION',
  'PENDING_SIGNATURE',
  'PENDING_PAYMENT',
]);

const STATUS_BADGE_TONES: Record<TicketStatus, string> = {
  OPEN: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  RECEIVED:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  IN_PROGRESS:
    'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  WAITING_PARTS:
    'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  DONE: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  CANCELLED:
    'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Chờ tiếp nhận',
  RECEIVED: 'Đã tiếp nhận',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_PARTS: 'Chờ vật tư',
  DONE: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

const PRIORITY_BADGE_TONES: Record<TicketPriority, string> = {
  LOW: 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  HIGH: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  URGENT:
    'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "EEEE, dd/MM/yyyy 'lúc' HH:mm", {
      locale: vi,
    });
  } catch {
    return iso;
  }
}

export default function TenantTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data: ticket, isLoading, isError, error, refetch } =
    useTenantTicketDetail(ticketId);
  const { data: contracts } = useMyContracts();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fallbackContext =
    contracts?.find((c) => ACTIVE_LIKE.has(c.status)) ?? contracts?.[0];

  const propertyId = ticket?.property_id ?? fallbackContext?.property_id;
  const roomId = ticket?.room_id ?? fallbackContext?.room_id;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <MaintenanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        propertyId={propertyId ?? undefined}
        roomId={roomId ?? undefined}
        onSubmitted={() => refetch()}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/app/tickets"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>

        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          disabled={!propertyId || !roomId}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" />
          Báo sự cố mới
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-[28px] border border-slate-200 bg-white p-16 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm font-bold text-slate-500">
            Đang tải chi tiết phiếu…
          </span>
        </div>
      ) : isError || !ticket ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-800 dark:bg-rose-500/10">
          <h3 className="text-base font-black text-rose-700 dark:text-rose-300">
            Không tải được chi tiết phiếu
          </h3>
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">
            {(error as Error)?.message ||
              'Phiếu có thể không tồn tại hoặc bạn không có quyền xem.'}
          </p>
          <Link
            to="/app/tickets"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Về danh sách
          </Link>
        </div>
      ) : (
        <>
          <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
              <span>Phiếu #{ticket.id.slice(0, 8)}</span>
              <span>·</span>
              <span>
                Tạo {formatDateTime(ticket.created_at)}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {ticket.description}
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-2xl border px-3 py-1 text-xs font-black uppercase tracking-wider ${STATUS_BADGE_TONES[ticket.status]}`}
              >
                {STATUS_LABELS[ticket.status]}
              </span>
              <span
                className={`rounded-2xl border px-3 py-1 text-xs font-black uppercase tracking-wider ${PRIORITY_BADGE_TONES[ticket.priority]}`}
              >
                Ưu tiên: {PRIORITY_LABELS[ticket.priority]}
              </span>
              {ticket.category && (
                <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {ticket.category}
                </span>
              )}
              {(ticket.room?.name || ticket.property?.name) && (
                <span className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  {ticket.property?.name}
                  {ticket.room?.name ? ` · ${ticket.room.name}` : ''}
                </span>
              )}
            </div>
          </header>

          <TicketTimeline ticketId={ticket.id} />
        </>
      )}
    </div>
  );
}
