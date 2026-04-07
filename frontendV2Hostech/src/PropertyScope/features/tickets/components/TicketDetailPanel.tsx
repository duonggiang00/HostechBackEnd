import { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, XCircle, DollarSign, MessageCircle, ChevronDown, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTicketDetail, useTicketMutations } from '../hooks/useTickets';
import TicketStatusBadge from './TicketStatusBadge';
import TicketPriorityBadge from './TicketPriorityBadge';
import type { TicketStatus } from '../types';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';

interface Props {
  ticketId: string;
  onClose: () => void;
}

const STATUS_FLOW: TicketStatus[] = ['OPEN', 'RECEIVED', 'IN_PROGRESS', 'WAITING_PARTS', 'DONE', 'CANCELLED'];

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Mở',
  RECEIVED: 'Đã nhận',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_PARTS: 'Chờ linh kiện',
  DONE: 'Hoàn thành',
  CANCELLED: 'Hủy',
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export default function TicketDetailPanel({ ticketId, onClose }: Props) {
  const { data: ticket, isLoading } = useTicketDetail(ticketId);
  const { updateStatus, addComment, addCost, deleteTicket } = useTicketMutations();

  const [activeTab, setActiveTab] = useState<'timeline' | 'costs'>('timeline');
  const [comment, setComment] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [costForm, setCostForm] = useState({ amount: '', payer: 'OWNER' as 'OWNER' | 'TENANT', note: '' });
  const [showCostForm, setShowCostForm] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [ticket?.events]);

  const handleStatusChange = async (status: TicketStatus) => {
    setStatusOpen(false);
    await updateStatus.mutateAsync({ id: ticketId, data: { status } });
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await addComment.mutateAsync({ ticketId, data: { message: comment } });
    setComment('');
  };

  const handleAddCost = async () => {
    if (!costForm.amount) return;
    await addCost.mutateAsync({
      ticketId,
      data: { amount: Number(costForm.amount), payer: costForm.payer, note: costForm.note || undefined },
    });
    setCostForm({ amount: '', payer: 'OWNER', note: '' });
    setShowCostForm(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa phiếu sự cố này?')) return;
    await deleteTicket.mutateAsync(ticketId);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {isLoading || !ticket ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <TicketStatusBadge status={ticket.status} />
                  <TicketPriorityBadge priority={ticket.priority} />
                  {ticket.category && (
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">
                      {ticket.category}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">{ticket.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {ticket.room?.code || ticket.room?.name} · {ticket.property?.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-3 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800">
              {/* Status Changer */}
              <PermissionGate role={['Owner', 'Manager', 'Staff']}>
                <div className="relative">
                  <button
                    onClick={() => setStatusOpen(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
                  >
                    Đổi trạng thái <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {statusOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden min-w-[160px]"
                      >
                        {STATUS_FLOW.filter(s => s !== ticket.status).map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className="block w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </PermissionGate>

              <PermissionGate role={['Owner', 'Manager']}>
                <button
                  onClick={() => setShowCostForm(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
                >
                  <DollarSign className="w-3 h-3" /> Chi phí
                </button>
                <button
                  onClick={handleDelete}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-xs font-bold text-rose-500 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" /> Xóa
                </button>
              </PermissionGate>
            </div>

            {/* Cost Form */}
            <AnimatePresence>
              {showCostForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Thêm chi phí</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Số tiền (VNĐ)"
                        value={costForm.amount}
                        onChange={e => setCostForm(f => ({ ...f, amount: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <select
                        value={costForm.payer}
                        onChange={e => setCostForm(f => ({ ...f, payer: e.target.value as any }))}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="OWNER">Chủ nhà</option>
                        <option value="TENANT">Khách thuê</option>
                      </select>
                    </div>
                    <input
                      placeholder="Ghi chú (tuỳ chọn)"
                      value={costForm.note}
                      onChange={e => setCostForm(f => ({ ...f, note: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowCostForm(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all">Hủy</button>
                      <button onClick={handleAddCost} disabled={addCost.isPending} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50">
                        {addCost.isPending ? 'Đang lưu...' : 'Lưu chi phí'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              {(['timeline', 'costs'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-all ${
                    activeTab === tab
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {tab === 'timeline' ? `Dòng thời gian (${ticket.events?.length ?? 0})` : `Chi phí (${ticket.costs?.length ?? 0})`}
                </button>
              ))}
            </div>

            {/* Body */}
            <div ref={timelineRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === 'timeline' && (
                <>
                  {(ticket.events ?? []).length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8">Chưa có hoạt động nào.</p>
                  )}
                  {(ticket.events ?? []).map(event => (
                    <div key={event.id} className="flex gap-3">
                      <div className={`mt-1 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        event.type === 'CREATED' ? 'bg-indigo-100 dark:bg-indigo-500/20' :
                        event.type === 'STATUS_CHANGED' ? 'bg-amber-100 dark:bg-amber-500/20' :
                        'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {event.type === 'CREATED' && <AlertCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        {event.type === 'STATUS_CHANGED' && <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                        {event.type === 'COMMENT' && <MessageCircle className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{event.actor?.full_name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{formatDate(event.created_at)}</span>
                        </div>
                        {event.type === 'STATUS_CHANGED' ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Chuyển sang <strong className="text-slate-700 dark:text-slate-200">{STATUS_LABELS[event.meta?.new_status as TicketStatus]}</strong>
                          </p>
                        ) : (
                          <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed">{event.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === 'costs' && (
                <>
                  {(ticket.costs ?? []).length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8">Chưa có chi phí nào được ghi nhận.</p>
                  )}
                  {(ticket.costs ?? []).map(cost => (
                    <div key={cost.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(cost.amount)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Bên chịu: <strong className={cost.payer === 'OWNER' ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}>
                            {cost.payer === 'OWNER' ? 'Chủ nhà' : 'Khách thuê'}
                          </strong>
                        </p>
                        {cost.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cost.note}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{cost.created_by?.full_name}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(cost.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {ticket.costs && ticket.costs.length > 0 && (
                    <div className="flex justify-between items-center px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tổng chi phí</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(ticket.costs.reduce((sum, c) => sum + c.amount, 0))}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Comment Box */}
            {activeTab === 'timeline' && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                  placeholder="Thêm bình luận..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleComment}
                  disabled={!comment.trim() || addComment.isPending}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
