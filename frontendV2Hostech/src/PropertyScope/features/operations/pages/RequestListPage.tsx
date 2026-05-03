import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, ArrowRightLeft, UserPlus, LogOut, CalendarClock,
  Clock, RefreshCw, CheckCircle, ExternalLink,
  AlertCircle, Loader2, Home
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { usePendingRequests, useApproveMember, useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';
import type { PendingRequest, PendingRequestType } from '@/PropertyScope/features/contracts/types';

// ─── Type config mapping ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<PendingRequestType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  ROOM_TRANSFER: {
    label: 'Chuyển phòng',
    icon: ArrowRightLeft,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  ADD_MEMBER: {
    label: 'Thêm thành viên',
    icon: UserPlus,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  TERMINATION: {
    label: 'Báo dời đi',
    icon: LogOut,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
  RENEWAL: {
    label: 'Gia hạn',
    icon: CalendarClock,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
};

// ─── TypeFilterTab ─────────────────────────────────────────────────────────────
function TypeFilterTab({ label, count, active, onClick }: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
        active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
      }`}>
        {count}
      </span>
    </button>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, count, color, onClick }: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group text-left w-full"
    >
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 leading-none">{count}</p>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{label}</p>
      </div>
    </button>
  );
}

// ─── Request Row ──────────────────────────────────────────────────────────────
function RequestRow({ req, onApprove, onViewContract }: {
  req: PendingRequest;
  onApprove: (req: PendingRequest) => void;
  onViewContract: (contractId: string, opts?: { openTerminate?: boolean }) => void;
}) {
  const config = TYPE_CONFIG[req.type];
  const Icon = config.icon;

  const detail = () => {
    if (req.type === 'ROOM_TRANSFER') {
      return <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded-lg">{req.from_room} → {req.to_room}</span>;
    }
    if (req.type === 'ADD_MEMBER') {
      return <span>{req.member_full_name} <span className="text-slate-400">({req.member_phone})</span></span>;
    }
    if (req.type === 'TERMINATION') {
      const move = req.expected_move_out_date
        ? format(new Date(req.expected_move_out_date), 'dd/MM/yyyy', { locale: vi })
        : null;
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          {move && (
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Dự kiến dọn: <span className="tabular-nums">{move}</span>
            </span>
          )}
          {req.reason ? <span className="text-slate-500">{req.reason}</span> : !move ? <span className="text-slate-400">—</span> : null}
        </div>
      );
    }
    if (req.type === 'RENEWAL') {
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Đề nghị đến: <span className="tabular-nums">{req.requested_end_date ? format(new Date(req.requested_end_date), 'dd/MM/yyyy', { locale: vi }) : '—'}</span>
          </span>
          {req.reason ? <span className="text-slate-500">{req.reason}</span> : <span className="text-slate-400">Không có ghi chú</span>}
        </div>
      );
    }
    return <span className="text-slate-500 ">{req.reason || 'Không có ghi chú'}</span>;
  };

  const timeAgo = req.requested_at
    ? formatDistanceToNow(new Date(req.requested_at), { addSuffix: true, locale: vi })
    : '—';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group hover:bg-slate-50/80 transition-colors"
    >
      {/* Type badge */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border ${config.bgColor} ${config.color} ${config.borderColor}`}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>
      </td>

      {/* Room */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-slate-300" />
          <span className="font-bold text-slate-900 text-sm">{req.room_name}</span>
        </div>
      </td>

      {/* Requester */}
      <td className="px-6 py-4">
        <span className="text-sm text-slate-700 font-semibold">{req.tenant_full_name || req.requester_full_name || '—'}</span>
      </td>

      {/* Detail */}
      <td className="px-6 py-4 text-sm text-slate-600">{detail()}</td>

      {/* Time */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span title={req.requested_at ? format(new Date(req.requested_at), 'dd/MM/yyyy HH:mm') : ''}>{timeAgo}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* View contract */}
          <button
            onClick={() => onViewContract(req.contract_id)}
            title="Xem hợp đồng"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Approve / Act */}
          {req.type === 'TERMINATION' ? (
            <button
              onClick={() => onViewContract(req.contract_id, { openTerminate: true })}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
            >
              Giải quyết
            </button>
          ) : req.type === 'ROOM_TRANSFER' ? (
            <button
              onClick={() => onApprove(req)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Giải quyết
            </button>
          ) : (
            <button
              onClick={() => onApprove(req)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Duyệt
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RequestListPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState<PendingRequestType | 'ALL'>('ALL');

  const { data, isLoading, isError, refetch } = usePendingRequests(propertyId);
  const approveMember = useApproveMember();
  const { approveRenewal } = useContractActions();

  const allRequests: PendingRequest[] = data?.data ?? [];
  const meta = data?.meta;

  const filtered = activeFilter === 'ALL'
    ? allRequests
    : allRequests.filter(r => r.type === activeFilter);

  const handleApprove = async (req: PendingRequest) => {
    if (req.type === 'ROOM_TRANSFER') {
      const target = req.to_room_id ? `?target_room_id=${encodeURIComponent(req.to_room_id)}` : '';
      navigate(`/properties/${propertyId}/contracts/${req.contract_id}/transfer${target}`);
      return;
    }

    if (req.type === 'ADD_MEMBER') {
      if (!req.member_id) return;
      const confirmed = window.confirm(`Duyệt thêm ${req.member_full_name} vào phòng ${req.room_name}?`);
      if (!confirmed) return;

      try {
        await approveMember.mutateAsync({ contractId: req.contract_id, memberId: req.member_id });
        toast.success(`Đã duyệt thêm ${req.member_full_name} thành công!`);
      } catch {
        toast.error('Có lỗi khi duyệt thành viên.');
      }
    }

    if (req.type === 'RENEWAL') {
      const asked = window.confirm(
        `Duyệt gia hạn hợp đồng này đến ${req.requested_end_date ? format(new Date(req.requested_end_date), 'dd/MM/yyyy', { locale: vi }) : 'ngày đề nghị'}?\n\nLưu ý: hệ thống sẽ chặn duyệt nếu hợp đồng còn nợ hóa đơn.`
      );
      if (!asked) return;

      try {
        await approveRenewal.mutateAsync({
          id: req.contract_id,
          data: req.request_index != null ? { request_index: req.request_index } : undefined,
        });
        toast.success('Đã duyệt yêu cầu gia hạn hợp đồng.');
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Không thể duyệt gia hạn hợp đồng.');
      }
    }
  };

  const handleViewContract = (contractId: string, opts?: { openTerminate?: boolean }) => {
    if (opts?.openTerminate) {
      navigate(`/properties/${propertyId}/contracts/${contractId}/terminate`);
      return;
    }
    navigate(`/properties/${propertyId}/contracts/${contractId}`);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-8 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Yêu cầu cư dân</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Hàng chờ duyệt {meta?.total ? `• ${meta.total} yêu cầu` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          icon={ArrowRightLeft}
          label="Chuyển phòng"
          count={meta?.transfer_count ?? 0}
          color="bg-blue-100 text-blue-600"
          onClick={() => setActiveFilter(activeFilter === 'ROOM_TRANSFER' ? 'ALL' : 'ROOM_TRANSFER')}
        />
        <KpiCard
          icon={UserPlus}
          label="Thêm thành viên"
          count={meta?.add_member_count ?? 0}
          color="bg-emerald-100 text-emerald-600"
          onClick={() => setActiveFilter(activeFilter === 'ADD_MEMBER' ? 'ALL' : 'ADD_MEMBER')}
        />
        <KpiCard
          icon={LogOut}
          label="Báo dời đi"
          count={meta?.termination_count ?? 0}
          color="bg-rose-100 text-rose-600"
          onClick={() => setActiveFilter(activeFilter === 'TERMINATION' ? 'ALL' : 'TERMINATION')}
        />
        <KpiCard
          icon={CalendarClock}
          label="Gia hạn"
          count={meta?.renewal_count ?? 0}
          color="bg-violet-100 text-violet-600"
          onClick={() => setActiveFilter(activeFilter === 'RENEWAL' ? 'ALL' : 'RENEWAL')}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <TypeFilterTab label="Tất cả" count={meta?.total ?? 0} active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} />
        <TypeFilterTab label="Chuyển phòng" count={meta?.transfer_count ?? 0} active={activeFilter === 'ROOM_TRANSFER'} onClick={() => setActiveFilter('ROOM_TRANSFER')} />
        <TypeFilterTab label="Thêm thành viên" count={meta?.add_member_count ?? 0} active={activeFilter === 'ADD_MEMBER'} onClick={() => setActiveFilter('ADD_MEMBER')} />
        <TypeFilterTab label="Báo dời đi" count={meta?.termination_count ?? 0} active={activeFilter === 'TERMINATION'} onClick={() => setActiveFilter('TERMINATION')} />
        <TypeFilterTab label="Gia hạn" count={meta?.renewal_count ?? 0} active={activeFilter === 'RENEWAL'} onClick={() => setActiveFilter('RENEWAL')} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="text-sm font-bold text-slate-500">Không thể tải dữ liệu</p>
            <button onClick={() => refetch()} className="text-xs text-indigo-600 underline">Thử lại</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
            <p className="text-sm font-bold text-slate-500">Không có yêu cầu nào đang chờ duyệt</p>
            <p className="text-xs text-slate-400">Hàng chờ của bạn sạch bong 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Loại yêu cầu</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Phòng</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Người gửi</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Chi tiết</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                </tr>
              </thead>
              <AnimatePresence mode="popLayout">
                <tbody className="divide-y divide-slate-50 bg-white">
                  {filtered.map((req, idx) => (
                    <RequestRow
                      key={`${req.type}-${req.contract_id}-${req.member_id ?? idx}`}
                      req={req}
                      onApprove={handleApprove}
                      onViewContract={handleViewContract}
                    />
                  ))}
                </tbody>
              </AnimatePresence>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
