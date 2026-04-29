import { motion } from 'framer-motion';
import {
  ClipboardCheck, Search, Filter,
  Calendar, User, ArrowRight,
  AlertCircle, CheckCircle2,
  LogOut, ShieldCheck, Loader2,
  MoreHorizontal
} from 'lucide-react';
import { useHandover } from '@/shared/features/operations/hooks/useHandover';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import HandoverForm from './HandoverForm';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  OUT: { label: 'Kết thúc hợp đồng', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400', Icon: LogOut },
  CHECKOUT: { label: 'Kết thúc hợp đồng', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400', Icon: LogOut },
  IN: { label: 'Kết thúc hợp đồng', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400', Icon: LogOut }, // legacy data
  CHECKIN: { label: 'Kết thúc hợp đồng', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400', Icon: LogOut }, // legacy data
} as const;

const STATUS_CONFIG = {
  COMPLETED: { label: 'Đã xác nhận', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', Icon: CheckCircle2 },
  DRAFT:     { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400',    Icon: AlertCircle  },
} as const;

function formatHandoverDate(item: any): string {
  const raw = item.confirmed_at ?? item.created_at;
  if (!raw) return '—';
  try {
    return format(parseISO(raw), 'dd/MM/yyyy', { locale: vi });
  } catch {
    return '—';
  }
}

function getTenantName(item: any): string {
  const member = item.contract?.primary_member ?? item.contract?.primaryMember;
  if (member?.full_name) return member.full_name;
  if (member?.name) return member.name;
  return 'Chưa có khách thuê';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HandoverListing() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [showForm, setShowForm]                     = useState(false);
  const [selectedHandover, setSelectedHandover]     = useState<any | null>(null);
  const [confirmingId, setConfirmingId]             = useState<string | null>(null);
  const [search, setSearch]                         = useState('');

  const hasRole = useAuthStore((s) => s.hasRole);
  const isManager = hasRole(['Manager', 'Owner', 'Admin']);

  const { useHandovers, confirmHandover } = useHandover();
  const { data: response, isLoading } = useHandovers({ property_id: propertyId });
  const allHandovers: any[] = response?.data ?? [];

  const handovers = allHandovers.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const roomName   = (item.room?.name ?? '').toLowerCase();
    const tenantName = getTenantName(item).toLowerCase();
    return roomName.includes(q) || tenantName.includes(q);
  });

  const handleConfirm = async (handoverId: string) => {
    setConfirmingId(handoverId);
    try {
      await confirmHandover.mutateAsync(handoverId);
      toast.success('Đã xác nhận biên bản bàn giao');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể xác nhận biên bản';
      toast.error(msg);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-6 bg-slate-50/30 dark:bg-slate-900/10 p-4 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none rotate-3">
              <ClipboardCheck className="w-6 h-6 text-white -rotate-3" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Giấy tờ & Bàn giao
              </h1>
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                Danh sách biên bản thanh lý & bàn giao phòng
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm số phòng hoặc khách thuê..."
              className="bg-white dark:bg-slate-800 border-none rounded-2xl pl-12 pr-6 py-3.5 text-sm outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500/50 transition-all w-80 font-bold shadow-sm dark:text-white"
            />
          </div>
          <button className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 flex items-center justify-center">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Form Modal ── */}
      {(showForm || selectedHandover) && (
        <HandoverForm
          mode="modal"
          onClose={() => { setShowForm(false); setSelectedHandover(null); }}
          initialData={selectedHandover}
          readOnly={!!selectedHandover}
        />
      )}

      {/* ── Table Container ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-100/50 dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-700/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loại</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Phòng</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Khách thuê</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ngày thực hiện</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Người xác nhận</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trạng thái</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-8 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/4" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : handovers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-[2rem] flex items-center justify-center mb-4">
                        <ClipboardCheck className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Chưa có bản ghi nào</p>
                      <p className="text-xs mt-2 font-medium">Biên bản được tạo tự động khi khách thanh lý phòng</p>
                    </div>
                  </td>
                </tr>
              ) : (
                handovers.map((item: any, idx) => {
                  const typeKey   = (item.type   ?? 'OUT').toUpperCase() as keyof typeof TYPE_CONFIG;
                  const statusKey = (item.status ?? 'DRAFT').toUpperCase() as keyof typeof STATUS_CONFIG;
                  const typeCfg   = TYPE_CONFIG[typeKey]   ?? TYPE_CONFIG.OUT;
                  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.DRAFT;
                  const TypeIcon   = typeCfg.Icon;
                  const StatusIcon = statusCfg.Icon;
                  const roomName   = item.room?.name ?? item.room?.code ?? '—';
                  const tenantName = getTenantName(item);
                  const dateStr    = formatHandoverDate(item);
                  const isDraft    = item.status === 'DRAFT';
                  const isConfirming = confirmingId === item.id;

                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* TYPE */}
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${typeCfg.color} shadow-sm`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeCfg.label}
                        </div>
                      </td>

                      {/* ROOM */}
                      <td className="px-6 py-6 text-center">
                        <span className="inline-flex items-center justify-center min-w-[3.5rem] px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-black rounded-xl">
                          {roomName}
                        </span>
                      </td>

                      {/* TENANT */}
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                            <User className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{tenantName}</span>
                        </div>
                      </td>

                      {/* DATE */}
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-bold">{dateStr}</span>
                        </div>
                      </td>

                      {/* STAFF */}
                      <td className="px-6 py-6">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 italic">
                          {item.confirmedBy?.name ?? <span className="text-slate-300 opacity-50">—</span>}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${statusCfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusCfg.label}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isManager && isDraft && (
                            <button
                              onClick={() => handleConfirm(item.id)}
                              disabled={isConfirming}
                              title="Xác nhận nhanh"
                              className="w-10 h-10 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 active:scale-95"
                            >
                              {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedHandover(item)}
                            title="Xem chi tiết"
                            className="w-10 h-10 flex items-center justify-center bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                          <button className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 rounded-xl hover:text-slate-600 transition-all border border-slate-100 dark:border-slate-700">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
