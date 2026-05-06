import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Package,
  Paperclip,
  Send,
  UserCheck,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useTenantAddComment,
  useTenantTicketDetail,
} from '@/shared/features/tickets/hooks/useTenantTickets';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import type {
  TicketAttachment,
  TicketEvent,
  TicketPriority,
  TicketStatus,
} from '@/PropertyScope/features/tickets/types';

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

const STATUS_ICONS: Record<TicketStatus, typeof Clock> = {
  OPEN: Clock,
  RECEIVED: UserCheck,
  IN_PROGRESS: Wrench,
  WAITING_PARTS: Package,
  DONE: CheckCircle2,
  CANCELLED: Ban,
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

const PRIORITY_TONES: Record<TicketPriority, string> = {
  LOW: 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  HIGH: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  URGENT: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return iso;
  }
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes < 1024) return `${bytes ?? 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TicketTimelineProps {
  ticketId: string;
}

export default function TicketTimeline({ ticketId }: TicketTimelineProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { data: ticket, isLoading, isError, error } =
    useTenantTicketDetail(ticketId);
  const addComment = useTenantAddComment(ticketId);

  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const [messageDraft, setMessageDraft] = useState('');

  const events: TicketEvent[] = useMemo(
    () =>
      [...(ticket?.events ?? [])].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [ticket?.events],
  );

  // Auto-scroll xuống cuối khi có event mới (giống TicketDetailPanel của staff).
  useEffect(() => {
    if (!eventsContainerRef.current) return;
    eventsContainerRef.current.scrollTop =
      eventsContainerRef.current.scrollHeight;
  }, [events.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-16 dark:border-slate-800 dark:bg-slate-900">
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
  const attachments = ticket.attachments ?? [];

  const handleSend = async () => {
    const message = messageDraft.trim();
    if (!message || addComment.isPending) return;

    try {
      await addComment.mutateAsync({ message });
      setMessageDraft('');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          'Không gửi được bình luận. Vui lòng thử lại.',
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex max-h-[min(85vh,720px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 border-b border-slate-200 p-8 pb-6 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
            Tiến độ xử lý
          </h3>
          <span
            className={`rounded-2xl border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${PRIORITY_TONES[ticket.priority]}`}
          >
            {PRIORITY_LABELS[ticket.priority]}
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Phiếu #{ticket.id.slice(0, 8)} · {STATUS_LABELS[status]}
          {ticket.category ? ` · ${ticket.category}` : ''}
        </p>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {ticket.description}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto" ref={eventsContainerRef}>
        <div className="space-y-8 p-8">
          {!isCancelled && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Trạng thái
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((st, idx) => {
                  const Icon = STATUS_ICONS[st];
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
                            : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
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
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
              <Ban className="h-6 w-6 shrink-0" />
              <span className="text-sm font-bold">
                Phiếu đã hủy, không còn xử lý.
              </span>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Tệp đính kèm ({attachments.length})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {attachments.map((att) => (
                  <AttachmentTile key={att.id} item={att} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Trao đổi với ban quản lý
            </p>

            {events.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có sự kiện ghi nhận. Bạn có thể nhắn cho ban quản lý ngay
                bên dưới.
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((ev, idx) => (
                  <TimelineEvent
                    key={ev.id}
                    event={ev}
                    attachments={attachments}
                    currentUserId={currentUser?.id}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-end gap-2">
          <textarea
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isCancelled || addComment.isPending}
            placeholder={
              isCancelled
                ? 'Phiếu đã hủy, không thể gửi tin nhắn.'
                : 'Nhắn cho ban quản lý… (Enter để gửi, Shift+Enter để xuống dòng)'
            }
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500/50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={
              isCancelled || !messageDraft.trim() || addComment.isPending
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {addComment.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({
  event,
  attachments,
  currentUserId,
  index,
}: {
  event: TicketEvent;
  attachments: TicketAttachment[];
  currentUserId?: string | number;
  index: number;
}) {
  const animation = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: Math.min(index * 0.03, 0.3) },
  };

  // Bubble chat 2 chiều cho COMMENT — bên phải nếu là user hiện tại.
  if (event.type === 'COMMENT') {
    const isMe =
      !!currentUserId &&
      event.actor?.id?.toString() === currentUserId.toString();
    return (
      <motion.div
        {...animation}
        className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
          <div
            className={`mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 ${
              isMe ? 'justify-end' : 'justify-start'
            }`}
          >
            <span>{event.actor?.full_name || 'Người dùng'}</span>
            <span>·</span>
            <span>{formatWhen(event.created_at)}</span>
          </div>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isMe
                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100'
                : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {event.message}
          </div>
        </div>
      </motion.div>
    );
  }

  if (event.type === 'ATTACHMENT_ADDED') {
    const mediaId = event.meta?.media_id;
    const media = attachments.find((a) => a.id === mediaId);

    return (
      <motion.div
        {...animation}
        className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
          <Paperclip className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-500">
            {event.actor?.full_name || 'Người dùng'} ·{' '}
            {formatWhen(event.created_at)}
          </p>
          <p className="mt-1 truncate font-bold text-slate-700 dark:text-slate-200">
            Đính kèm: {media?.name || event.meta?.name || 'tệp mới'}
          </p>
          {media && (
            <a
              href={media.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              <ExternalLink className="h-3 w-3" /> Xem tệp
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  // CREATED / STATUS_CHANGED / khác — hiển thị system event nhỏ.
  const tone =
    event.type === 'STATUS_CHANGED'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400';

  return (
    <motion.div
      {...animation}
      className={`flex items-start gap-3 rounded-2xl border p-3 text-xs ${tone}`}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        {event.type === 'STATUS_CHANGED' ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <span>
            {event.type === 'CREATED'
              ? 'Tạo phiếu'
              : event.type === 'STATUS_CHANGED'
                ? `Chuyển sang ${
                    STATUS_LABELS[event.meta?.new_status as TicketStatus] ||
                    event.meta?.new_status ||
                    '—'
                  }`
                : event.type}
          </span>
          <span className="text-slate-500">{formatWhen(event.created_at)}</span>
        </div>
        {event.actor?.full_name && (
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            Bởi {event.actor.full_name}
          </p>
        )}
        {event.message && (
          <p className="mt-1 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
            {event.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function AttachmentTile({ item }: { item: TicketAttachment }) {
  const isImage = item.mime_type?.startsWith('image/');

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-colors hover:border-emerald-500/40 dark:border-slate-800 dark:bg-slate-900"
    >
      {isImage ? (
        <img
          src={item.url}
          alt={item.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-slate-400">
          <FileText className="h-6 w-6" />
          <span className="line-clamp-2 text-center text-[10px] font-bold">
            {item.name}
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/90 to-transparent p-2 text-[10px] font-bold text-white">
        <Download className="h-3 w-3 shrink-0" />
        <span className="truncate">{formatBytes(item.size)}</span>
      </div>
    </a>
  );
}
