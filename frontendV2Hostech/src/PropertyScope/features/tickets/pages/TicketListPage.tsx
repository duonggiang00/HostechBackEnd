import { useState } from 'react';
import { Ticket, Plus, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import TicketStatusBadge from '../components/TicketStatusBadge';
import TicketPriorityBadge from '../components/TicketPriorityBadge';
import TicketDetailPanel from '../components/TicketDetailPanel';
import TicketForm from '../components/TicketForm';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';
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

  const [params, setParams] = useState<TicketQueryParams>({ property_id: propertyId, page: 1, per_page: 15 });
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
    <div className="min-h-screen pb-20">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none">
            <Ticket className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Sự cố & Yêu cầu</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {meta ? `${meta.total} phiếu` : 'Quản lý phiếu sự cố'}
            </p>
          </div>
        </div>
        <PermissionGate role={['Admin', 'Owner', 'Manager', 'Staff']}>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
          >
            <Plus className="w-4 h-4" /> Tạo phiếu mới
          </button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white dark:border-slate-800/50 shadow-xl p-5 mb-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
            placeholder="Tìm kiếm phiếu sự cố..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                (params.status ?? 'ALL') === f.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white dark:border-slate-800/50 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Không có phiếu nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((ticket, i) => (
              <motion.button
                key={ticket.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedId(ticket.id)}
                className="w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                {/* Left accent */}
                <div className={`mt-1.5 w-1 h-10 rounded-full shrink-0 ${
                  ticket.priority === 'URGENT' ? 'bg-rose-500' :
                  ticket.priority === 'HIGH' ? 'bg-amber-500' :
                  ticket.priority === 'MEDIUM' ? 'bg-blue-500' :
                  'bg-slate-300 dark:bg-slate-600'
                }`} />

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <TicketStatusBadge status={ticket.status} size="sm" />
                    <TicketPriorityBadge priority={ticket.priority} size="sm" />
                    {ticket.category && (
                      <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{ticket.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ticket.room?.code} · {ticket.created_by?.full_name} · {formatDate(ticket.created_at)}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 mt-2 transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trang {meta.current_page} / {meta.last_page} · {meta.total} phiếu
            </p>
            <div className="flex gap-2">
              <button
                disabled={meta.current_page <= 1}
                onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) - 1 }))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) + 1 }))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Slide-over */}
      <AnimatePresence>
        {selectedId && (
          <TicketDetailPanel
            key={selectedId}
            ticketId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Tạo phiếu sự cố mới</h2>
              </div>
              <div className="p-6">
                <TicketForm
                  propertyId={propertyId!}
                  onSuccess={() => { setShowCreate(false); refetch(); }}
                  onCancel={() => setShowCreate(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
