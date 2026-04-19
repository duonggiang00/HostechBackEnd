import { useState, useEffect } from 'react';
import { X, Plus, CheckCircle, XCircle, Clock, AlertCircle, Loader2, MessageSquare, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meteringApi } from '../api/metering';
import type { AdjustmentNote, MeterReading } from '../types';
import { MultipleImageUploader, type UploadedProof } from './MultipleImageUploader';

interface AdjustmentNoteDrawerProps {
  reading: MeterReading;
  isOpen: boolean;
  onClose: () => void;
  /** Nếu true, có thể tạo + approve/reject. Nếu false, chỉ xem */
  canManage?: boolean;
  unit: string;
}

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  APPROVED: { label: 'Đã duyệt', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
};

function AdjustmentNoteCard({
  note,
  readingId,
  canManage,
  unit,
  onUpdated,
}: {
  note: AdjustmentNote;
  readingId: string;
  canManage: boolean;
  unit: string;
  onUpdated: () => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isActing, setIsActing] = useState(false);
  const [showProofs, setShowProofs] = useState(false);

  const config = STATUS_CONFIG[note.status] ?? STATUS_CONFIG.PENDING;

  const handleApprove = async () => {
    setIsActing(true);
    try {
      await meteringApi.approveAdjustmentNote(readingId, note.id);
      toast.success('Đã duyệt phiếu điều chỉnh');
      onUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi khi duyệt');
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setIsActing(true);
    try {
      await meteringApi.rejectAdjustmentNote(readingId, note.id, rejectReason);
      toast.success('Đã từ chối phiếu điều chỉnh');
      setShowReject(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi khi từ chối');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Note Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {note.requested_by?.name ?? 'Người dùng'}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${config.className}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words">{note.reason}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
            {note.created_at ? new Date(note.created_at).toLocaleDateString('vi-VN') : ''}
          </p>
        </div>
      </div>

      {/* Value Change */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 flex items-center gap-4 text-sm border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chỉ số cũ</span>
          <span className="font-mono font-black text-slate-500 dark:text-slate-400">{note.before_value.toLocaleString()}</span>
          <span className="text-[10px] text-slate-300">{unit}</span>
        </div>
        <div className="text-slate-300 text-lg font-thin">→</div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đề nghị sửa</span>
          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{note.after_value.toLocaleString()}</span>
          <span className="text-[10px] text-slate-300">{unit}</span>
        </div>
        {note.status === 'APPROVED' && note.approved_by && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              Duyệt bởi {note.approved_by.name}
            </p>
            <p className="text-[10px] text-slate-400">
              {note.approved_at ? new Date(note.approved_at).toLocaleDateString('vi-VN') : ''}
            </p>
          </div>
        )}
        {note.status === 'REJECTED' && note.reject_reason && (
          <div className="ml-auto text-right max-w-[140px]">
            <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">Lý do từ chối:</p>
            <p className="text-[10px] text-slate-500 break-words">{note.reject_reason}</p>
          </div>
        )}
      </div>

      {/* Proofs toggle */}
      {note.proofs && note.proofs.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowProofs(!showProofs)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProofs ? 'rotate-180' : ''}`} />
            {note.proofs.length} ảnh minh chứng
          </button>
          {showProofs && (
            <div className="flex flex-wrap gap-2 mt-2">
              {note.proofs.map((p, idx) => (
                <a key={idx} href={p.url} target="_blank" rel="noreferrer">
                  <img
                    src={p.url}
                    alt={p.name ?? 'proof'}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions for PENDING notes (Manager only) */}
      {canManage && note.status === 'PENDING' && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
          {!showReject ? (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Duyệt
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-500/30 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Từ chối
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReject(false); setRejectReason(''); }}
                  className="flex-1 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={isActing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateNoteForm({
  reading,
  unit,
  onCreated,
  onCancel,
}: {
  reading: MeterReading;
  unit: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [afterValue, setAfterValue] = useState('');
  const [proofs, setProofs] = useState<UploadedProof[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Vui lòng nhập lý do điều chỉnh'); return; }
    const val = parseInt(afterValue);
    if (isNaN(val) || val < 0) { setError('Chỉ số đề nghị phải là số không âm'); return; }
    if (proofs.length === 0) { setError('Cần ít nhất 1 ảnh minh chứng cho phiếu điều chỉnh'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      await meteringApi.createAdjustmentNote(reading.id, {
        reason: reason.trim(),
        after_value: val,
        proof_media_ids: proofs.map((p) => p.temporaryId),
      });
      toast.success('Đã gửi phiếu yêu cầu điều chỉnh');
      onCreated();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.reading?.[0] || 'Có lỗi xảy ra';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-900/10 p-4 space-y-4">
      <h4 className="text-sm font-bold text-slate-800 dark:text-white">Gửi phiếu yêu cầu điều chỉnh</h4>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Chỉ số hiện tại</label>
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono font-black text-sm text-slate-700 dark:text-slate-300">
            {reading.reading_value.toLocaleString()} <span className="font-normal text-slate-400">{unit}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Chỉ số đề nghị sửa</label>
          <div className="relative">
            <input
              type="number"
              value={afterValue}
              onChange={(e) => setAfterValue(e.target.value)}
              min={0}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{unit}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Lý do điều chỉnh</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="VD: Ảnh chốt số bị mờ, số thực tế là 1234..."
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <MultipleImageUploader
        value={proofs}
        onChange={setProofs}
        maxFiles={3}
        label="Ảnh minh chứng (bắt buộc)"
      />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Gửi phiếu điều chỉnh
        </button>
      </div>
    </div>
  );
}

export function AdjustmentNoteDrawer({
  reading,
  isOpen,
  onClose,
  canManage = false,
  unit,
}: AdjustmentNoteDrawerProps) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: notes = [], isLoading, refetch } = useQuery<AdjustmentNote[]>({
    queryKey: ['adjustment-notes', reading.id],
    queryFn: () => meteringApi.getAdjustmentNotes(reading.id),
    enabled: isOpen && reading.status === 'LOCKED',
  });

  const handleUpdated = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['meter-readings', reading.meter_id] });
  };

  const isLocked = reading.status === 'LOCKED';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Ghi chú điều chỉnh
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chốt số {reading.reading_value.toLocaleString()} {unit} — {reading.period_end ?? ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Non-locked notice */}
          {!isLocked && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Chưa thể điều chỉnh</p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                  Chỉ số phải ở trạng thái &quot;Đã khóa&quot; (LOCKED) mới có thể tạo phiếu điều chỉnh.
                </p>
              </div>
            </div>
          )}

          {/* Create new note */}
          {isLocked && !showCreateForm && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 rounded-xl text-sm font-semibold text-slate-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              Yêu cầu điều chỉnh chỉ số
            </button>
          )}

          {showCreateForm && (
            <CreateNoteForm
              reading={reading}
              unit={unit}
              onCreated={() => { setShowCreateForm(false); handleUpdated(); }}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Notes List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Đang tải...</p>
            </div>
          ) : notes.length === 0 && isLocked ? (
            <div className="py-12 text-center">
              <MessageSquare className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Chưa có phiếu điều chỉnh nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <AdjustmentNoteCard
                  key={note.id}
                  note={note}
                  readingId={reading.id}
                  canManage={canManage}
                  unit={unit}
                  onUpdated={handleUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
