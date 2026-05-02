import { useState } from 'react';
import { Plus, ChevronRight, Loader2, X } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import TicketStatusBadge from './TicketStatusBadge';
import TicketDetailPanel from './TicketDetailPanel';
import TicketForm from './TicketForm';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';

interface Props {
  propertyId: string;
  roomId: string;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

export default function RoomTicketsTab({ propertyId, roomId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, refetch } = useTickets({
    property_id: propertyId,
    room_id: roomId,
    per_page: 5,
    sort: '-created_at',
  });

  const tickets = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Sự cố gần đây
          <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">({data?.meta.total ?? 0})</span>
        </h3>
        <PermissionGate role={['Owner', 'Manager', 'Staff', 'Tenant']}>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Tạo phiếu
          </button>
        </PermissionGate>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" aria-label="Đang tải" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-400">Chưa có sự cố nào cho phòng này.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map(ticket => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div
                    className={`h-8 w-1 shrink-0 rounded-full ${
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
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{formatDate(ticket.created_at)}</p>
                    <div className="mb-0.5 mt-1 flex flex-wrap items-center gap-1.5">
                      <TicketStatusBadge status={ticket.status} size="sm" />
                      {ticket.category && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {ticket.category}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">{ticket.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId && <TicketDetailPanel ticketId={selectedId} onClose={() => setSelectedId(null)} />}

      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Đóng" onClick={() => setShowCreate(false)} />
          <div
            className="relative z-10 max-h-[90vh] w-full max-w-md overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:rounded-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Báo cáo sự cố</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <TicketForm
                propertyId={propertyId}
                roomId={roomId}
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
