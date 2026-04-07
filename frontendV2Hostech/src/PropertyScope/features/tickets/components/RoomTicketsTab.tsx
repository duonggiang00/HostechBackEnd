import { useState } from 'react';
import { Plus, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const { data, isLoading, refetch } = useTickets({ property_id: propertyId, room_id: roomId, per_page: 5 });

  const tickets = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Sự cố & Yêu cầu ({data?.meta.total || 0})
        </h3>
        <PermissionGate role={['Owner', 'Manager', 'Staff', 'Tenant']}>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo phiếu
          </button>
        </PermissionGate>
      </div>

      <div className="bg-white/50 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center p-8 text-slate-500 dark:text-slate-400 text-sm">
            Chưa có sự cố nào cho phòng này.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {tickets.map((ticket, i) => (
              <motion.button
                key={ticket.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedId(ticket.id)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className={`w-1 h-8 rounded-full shrink-0 ${
                  ticket.priority === 'URGENT' ? 'bg-rose-500' :
                  ticket.priority === 'HIGH' ? 'bg-amber-500' :
                  ticket.priority === 'MEDIUM' ? 'bg-blue-500' :
                  'bg-slate-300 dark:bg-slate-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <TicketStatusBadge status={ticket.status} size="sm" />
                    {ticket.category && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{ticket.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(ticket.created_at)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedId && (
          <TicketDetailPanel
            ticketId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">Báo cáo sự cố</h3>
                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  ✕
                </button>
              </div>
              <div className="p-6">
                <TicketForm
                  propertyId={propertyId}
                  roomId={roomId}
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
