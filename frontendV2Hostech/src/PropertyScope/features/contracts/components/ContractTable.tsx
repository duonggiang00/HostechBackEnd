import React from 'react';
import { Pencil, Trash2, ShieldAlert, Clock, Search, Filter, LayoutGrid, RotateCcw, ArrowDownUp, Eye } from 'lucide-react';
import type { Contract, ContractStatus } from '@/PropertyScope/features/contracts/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

// ─── Status Configuration ─────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
}

const STATUS_CONFIG: Record<ContractStatus, StatusConfig> = {
  DRAFT: {
    label: 'Bản nháp',
    bg: 'bg-slate-50 dark:bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400 dark:bg-slate-500',
    border: 'border-slate-200 dark:border-slate-500/20',
  },
  PENDING_SIGNATURE: {
    label: 'Chờ ký',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-400 dark:bg-amber-500',
    border: 'border-amber-200 dark:border-amber-500/20',
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-400 dark:bg-orange-500',
    border: 'border-orange-200 dark:border-orange-500/20',
  },
  ACTIVE: {
    label: 'Hiệu lực',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/20',
  },
  ENDED: {
    label: 'Đã kết thúc',
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-400 dark:bg-red-500',
    border: 'border-red-200 dark:border-red-500/20',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    bg: 'bg-gray-50 dark:bg-gray-500/10',
    text: 'text-gray-500 dark:text-gray-400',
    dot: 'bg-gray-400 dark:bg-gray-500',
    border: 'border-gray-200 dark:border-gray-500/20',
  },
};

// ─── Currency Formatter ───────────────────────────────────────────────────────

const formatVND = (amount: number | null | undefined) => {
  if (!amount) return null;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: ContractStatus }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
};

// ─── Component Interface ──────────────────────────────────────────────────────

interface ContractTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onViewDetail: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  isTrashView?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  onViewChange: (isTrash: boolean) => void;
  sort?: string;
  onSortChange?: (field: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ContractTable: React.FC<ContractTableProps> = ({
  contracts,
  onEdit,
  onViewDetail,
  onDelete,
  isTrashView = false,
  search,
  onSearchChange,
  status,
  onStatusChange,
  onViewChange,
  sort = '-created_at',
  onSortChange,
}) => {
  const SortableHeader = ({ field, children, className = '' }: { field: string; children: React.ReactNode; className?: string }) => {
    const isActive = sort.replace('-', '') === field;
    const isDesc = sort.startsWith('-');
    return (
      <TableHead
        className={`h-11 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none ${className}`}
        onClick={() => onSortChange?.(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive && (
            <ArrowDownUp className={`w-3 h-3 text-indigo-500 dark:text-indigo-400 transition-transform ${isDesc ? 'rotate-180' : ''}`} />
          )}
        </div>
      </TableHead>
    );
  };
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
      {/* ─── Integrated Filter Header ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Tìm tên, SĐT, mã phòng..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-indigo-500/20 dark:text-slate-100"
          />
        </div>

        {/* Status Filter */}
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium dark:text-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <SelectValue placeholder="Trạng thái" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-1">
            <SelectItem value="all" className="rounded-md text-sm font-medium py-2 dark:text-slate-200 dark:hover:bg-slate-700">Tất cả</SelectItem>
            <SelectItem value="DRAFT" className="rounded-md text-sm font-medium py-2 dark:text-slate-200 dark:hover:bg-slate-700">Bản nháp</SelectItem>
            <SelectItem value="PENDING_SIGNATURE" className="rounded-md text-sm font-medium py-2 dark:text-slate-200 dark:hover:bg-slate-700">Chờ ký</SelectItem>
            <SelectItem value="PENDING_PAYMENT" className="rounded-md text-sm font-medium py-2 dark:text-slate-200 dark:hover:bg-slate-700">Chờ thanh toán</SelectItem>
            <SelectItem value="ACTIVE" className="rounded-md text-sm font-medium py-2 dark:text-slate-200 dark:hover:bg-slate-700">Hiệu lực</SelectItem>
            <SelectItem value="ENDED" className="rounded-md text-sm font-medium py-2 dark:text-slate-200 dark:hover:bg-slate-700">Đã kết thúc</SelectItem>
            <SelectItem value="CANCELLED" className="rounded-md text-sm font-medium py-2 dark:text-slate-200 dark:hover:bg-slate-700">Đã huỷ</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <button
            onClick={() => onViewChange(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              !isTrashView
                ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Hoạt động
          </button>
          <button
            onClick={() => onViewChange(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              isTrashView
                ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Thùng rác
          </button>
        </div>
      </div>

      {/* ─── Table ─── */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-white/10">
            <TableHead className="w-[130px] h-11 px-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phòng</TableHead>
            <TableHead className="h-11 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Người thuê</TableHead>
            <SortableHeader field="start_date">Thời hạn</SortableHeader>
            <SortableHeader field="rent_price" className="text-right">Giá thuê</SortableHeader>
            <TableHead className="h-11 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right">Giá thực tế</TableHead>
            <SortableHeader field="status" className="text-center">Trạng thái</SortableHeader>
            <TableHead className="w-[100px] h-11 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {contracts.map((contract, index) => {
              const primaryMember = contract.members?.find((m) => m.is_primary);
              const tenantName = primaryMember?.full_name || 'Chưa cập nhật';
              const startDate = contract.start_date
                ? new Date(contract.start_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '---';
              const endDate = contract.end_date
                ? new Date(contract.end_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '...';

              const baseRent = formatVND(contract.base_rent);
              const totalRent = formatVND(contract.total_rent);

              return (
                <motion.tr
                  key={contract.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors border-b border-slate-50 dark:border-white/5 last:border-0"
                >
                  {/* Room */}
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {contract.room?.name || '---'}
                      </span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tracking-wide mt-0.5">
                        {contract.join_code || '---'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Tenant */}
                  <TableCell className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-50 dark:border-indigo-500/20">
                        {tenantName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{tenantName}</span>
                    </div>
                  </TableCell>

                  {/* Duration */}
                  <TableCell className="px-3 py-3">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{startDate}</span>
                      <span className="text-slate-300 dark:text-slate-600">→</span>
                      <span>{endDate}</span>
                    </div>
                  </TableCell>

                  {/* Base Rent */}
                  <TableCell className="px-3 py-3 text-right">
                    {baseRent ? (
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{baseRent}</span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">---</span>
                    )}
                  </TableCell>

                  {/* Total Rent */}
                  <TableCell className="px-3 py-3 text-right">
                    {totalRent ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{totalRent}</span>
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">/tháng</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">Chưa chốt</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-3 py-3 text-center">
                    <StatusBadge status={contract.status as ContractStatus} />
                  </TableCell>

                  {/* Actions — always visible */}
                  <TableCell className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {isTrashView ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Khôi phục"
                            onClick={() => onEdit(contract)}
                            className="h-8 w-8 p-0 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xóa vĩnh viễn"
                            onClick={() => onDelete(contract)}
                            className="h-8 w-8 p-0 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xem chi tiết"
                            onClick={() => onViewDetail(contract)}
                            className="h-8 w-8 p-0 rounded-lg text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!['ACTIVE', 'ENDED'].includes(contract.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Sửa"
                              onClick={() => onEdit(contract)}
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xoá"
                            onClick={() => onDelete(contract)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>

      {/* ─── Empty State ─── */}
      {contracts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-slate-50 dark:bg-slate-700/50 p-6 mb-4 ring-1 ring-slate-100 dark:ring-white/10">
            <ShieldAlert className="h-10 w-10 text-slate-300 dark:text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Không có dữ liệu</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isTrashView
              ? 'Thùng rác đang trống'
              : 'Không tìm thấy hợp đồng phù hợp'}
          </p>
        </div>
      )}
    </div>
  );
};
