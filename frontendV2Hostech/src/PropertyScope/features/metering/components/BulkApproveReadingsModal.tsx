import { useState, useMemo } from 'react';
import { X, CheckCircle2, XCircle, Loader2, Zap, Droplet, AlertCircle, CheckSquare, Square, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { usePropertyReadings, useBulkApproveReadings } from '../hooks/useMeters';
import type { MeterReading } from '../types';

interface Props {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ReadingWithMeter extends MeterReading {
  meter?: {
    id: string;
    code: string;
    type: 'ELECTRIC' | 'WATER';
    room?: { id: string; name: string; code: string };
  };
}

export function BulkApproveReadingsModal({ propertyId, isOpen, onClose }: Props) {
  const thisMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const thisMonthEnd   = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'PENDING' | 'APPROVED'>('PENDING');

  const { data: pendingData, isLoading: loadingPending } = usePropertyReadings(propertyId, {
    status: 'PENDING',
    period_start: thisMonthStart,
    period_end: thisMonthEnd,
  });

  const { data: approvedData, isLoading: loadingApproved } = usePropertyReadings(propertyId, {
    status: 'APPROVED',
    period_start: thisMonthStart,
    period_end: thisMonthEnd,
  });

  const { approveMutation, rejectMutation } = useBulkApproveReadings(propertyId);

  const pendingReadings: ReadingWithMeter[] = (pendingData?.data ?? []) as ReadingWithMeter[];
  const approvedReadings: ReadingWithMeter[] = (approvedData?.data ?? []) as ReadingWithMeter[];

  // Group pending by room for display
  const groupedPending = useMemo(() => {
    const groups: Record<string, ReadingWithMeter[]> = {};
    pendingReadings.forEach((r) => {
      const roomName = r.meter?.room?.name ?? 'Chưa xếp phòng';
      if (!groups[roomName]) groups[roomName] = [];
      groups[roomName].push(r);
    });
    return groups;
  }, [pendingReadings]);

  const isAllSelected = pendingReadings.length > 0 && selectedIds.size === pendingReadings.length;
  const isNoneSelected = selectedIds.size === 0;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingReadings.map(r => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildItems = (ids: Set<string>) =>
    pendingReadings
      .filter(r => ids.has(r.id) && r.meter?.id)
      .map(r => ({ meterId: r.meter!.id, readingId: r.id }));

  const handleApproveSelected = async () => {
    const items = buildItems(selectedIds);
    if (!items.length) return;
    await approveMutation.mutateAsync(items);
    setSelectedIds(new Set());
  };

  const handleApproveAll = async () => {
    const items = pendingReadings
      .filter(r => r.meter?.id)
      .map(r => ({ meterId: r.meter!.id, readingId: r.id }));
    if (!items.length) return;
    await approveMutation.mutateAsync(items);
    setSelectedIds(new Set());
  };

  const handleRejectSelected = async () => {
    const items = buildItems(selectedIds);
    if (!items.length) return;
    const reason = window.prompt('Lý do từ chối (tùy chọn):');
    if (reason === null) return;
    await rejectMutation.mutateAsync({ items, reason });
    setSelectedIds(new Set());
  };

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Duyệt chốt số</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tháng {format(new Date(), 'MM/yyyy')} — {pendingReadings.length} chờ duyệt · {approvedReadings.length} đã duyệt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setTab('PENDING')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
              tab === 'PENDING'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 bg-amber-50/50 dark:bg-amber-500/5'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Chờ duyệt
            {pendingReadings.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-[10px]">
                {pendingReadings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('APPROVED')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
              tab === 'APPROVED'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Đã duyệt
            {approvedReadings.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px]">
                {approvedReadings.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Bar — chỉ hiện ở tab PENDING */}
        {tab === 'PENDING' && pendingReadings.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {isAllSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${pendingReadings.length})`}
            </button>

            <div className="flex items-center gap-2">
              {!isNoneSelected && (
                <>
                  <button
                    onClick={handleRejectSelected}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Từ chối ({selectedIds.size})
                  </button>
                  <button
                    onClick={handleApproveSelected}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Duyệt ({selectedIds.size})
                  </button>
                </>
              )}
              <button
                onClick={handleApproveAll}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Duyệt tất cả
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {tab === 'PENDING' ? (
              <motion.div
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {loadingPending ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : pendingReadings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                    <p className="text-lg font-black text-slate-900 dark:text-white">Tất cả đã được duyệt!</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Không còn chốt số nào đang chờ duyệt trong tháng này.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.entries(groupedPending).map(([roomName, readings]) => (
                      <div key={roomName}>
                        <div className="px-6 py-2.5 bg-slate-50/70 dark:bg-slate-800/30 flex items-center gap-2">
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{roomName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold">{readings.length}</span>
                        </div>
                        {readings.map((r) => {
                          const isElec = r.meter?.type === 'ELECTRIC';
                          const isSelected = selectedIds.has(r.id);
                          return (
                            <div
                              key={r.id}
                              onClick={() => toggleOne(r.id)}
                              className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50/60 dark:bg-indigo-500/5'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              {/* Checkbox */}
                              <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>

                              {/* Meter icon */}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isElec ? 'bg-yellow-50 dark:bg-yellow-500/10' : 'bg-blue-50 dark:bg-blue-500/10'
                              }`}>
                                {isElec
                                  ? <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                  : <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                              </div>

                              {/* Meter code */}
                              <div className="w-28 flex-shrink-0">
                                <p className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono">{r.meter?.code ?? '—'}</p>
                                <p className="text-[10px] text-slate-400 uppercase">{isElec ? 'Điện' : 'Nước'}</p>
                              </div>

                              {/* Period */}
                              <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                                {r.period_start && r.period_end
                                  ? `${new Date(r.period_start).toLocaleDateString('vi-VN')} → ${new Date(r.period_end).toLocaleDateString('vi-VN')}`
                                  : '—'}
                              </div>

                              {/* Reading value */}
                              <div className="text-right w-24 flex-shrink-0">
                                <p className="text-sm font-black text-slate-900 dark:text-white">{r.reading_value?.toLocaleString('vi-VN')}</p>
                                {r.consumption !== undefined && r.consumption > 0 && (
                                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+{r.consumption.toLocaleString('vi-VN')} {isElec ? 'kWh' : 'm³'}</p>
                                )}
                              </div>

                              {/* Submitted by */}
                              <div className="text-right w-20 flex-shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                                {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('vi-VN') : '—'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="approved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {loadingApproved ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                ) : approvedReadings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-lg font-black text-slate-900 dark:text-white">Chưa có chốt số nào được duyệt</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hãy duyệt các chốt số đang chờ ở tab bên trái.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {approvedReadings.map((r) => {
                      const isElec = (r as ReadingWithMeter).meter?.type === 'ELECTRIC';
                      return (
                        <div key={r.id} className="flex items-center gap-4 px-6 py-3.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isElec ? 'bg-yellow-50 dark:bg-yellow-500/10' : 'bg-blue-50 dark:bg-blue-500/10'
                          }`}>
                            {isElec ? <Zap className="w-4 h-4 text-yellow-600" /> : <Droplet className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div className="w-28 flex-shrink-0">
                            <p className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono">{(r as ReadingWithMeter).meter?.code ?? '—'}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{(r as ReadingWithMeter).meter?.room?.name ?? '—'}</p>
                          </div>
                          <div className="flex-1 text-xs text-slate-500">
                            {r.period_start && r.period_end
                              ? `${new Date(r.period_start).toLocaleDateString('vi-VN')} → ${new Date(r.period_end).toLocaleDateString('vi-VN')}`
                              : '—'}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {r.reading_value?.toLocaleString('vi-VN')} {isElec ? 'kWh' : 'm³'}
                            </p>
                            {r.consumption !== undefined && r.consumption > 0 && (
                              <p className="text-[10px] text-slate-400">+{r.consumption.toLocaleString('vi-VN')}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
}
