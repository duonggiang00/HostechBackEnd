import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { contractsApi } from '@/PropertyScope/features/contracts/api/contracts';
import { useContractActions } from '@/PropertyScope/features/contracts/hooks/useContracts';

type RoomRow = { id: string; name?: string; code?: string };

interface TenantRoomTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
}

export function TenantRoomTransferModal({ isOpen, onClose, contractId }: TenantRoomTransferModalProps) {
  const { requestRoomTransfer } = useContractActions();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen || !contractId) return;
    setLoadingRooms(true);
    setTargetRoomId('');
    setReason('');
    contractsApi
      .getAvailableRooms(contractId)
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setRooms(list);
      })
      .catch(() => {
        toast.error('Không tải được danh sách phòng trống.');
        setRooms([]);
      })
      .finally(() => setLoadingRooms(false));
  }, [isOpen, contractId]);

  const handleSubmit = () => {
    if (!targetRoomId) {
      toast.error('Vui lòng chọn phòng muốn chuyển.');
      return;
    }
    requestRoomTransfer.mutate(
      {
        id: contractId,
        data: { target_room_id: targetRoomId, reason: reason.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success('Đã gửi đề nghị chuyển phòng. Vui lòng chờ ban quản lý xử lý.');
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Không gửi được yêu cầu.');
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Đóng"
            onClick={() => !requestRoomTransfer.isPending && onClose()}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Đề nghị chuyển phòng</h2>
                  <p className="text-xs font-medium text-slate-500">Chỉ phòng trống cùng tòa nhà</p>
                </div>
              </div>
              <button
                type="button"
                disabled={requestRoomTransfer.isPending}
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {loadingRooms ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-center text-sm font-medium text-slate-500">Hiện không có phòng trống phù hợp.</p>
              ) : (
                <>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Phòng đích</label>
                  <select
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">— Chọn phòng —</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name || r.code || r.id}
                      </option>
                    ))}
                  </select>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Lý do (tuỳ chọn)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Ví dụ: cần phòng rộng hơn, tầng thấp hơn…"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                disabled={requestRoomTransfer.isPending}
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={requestRoomTransfer.isPending || !targetRoomId || loadingRooms}
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {requestRoomTransfer.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Gửi đề nghị
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
