import { useState } from 'react';
import {
  ChevronRight, ClipboardList,
  CheckCircle2, Clock, ShieldCheck, Loader2, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import HandoverForm from '@/PropertyScope/features/operations/components/HandoverForm';
import { useHandover } from '@/shared/features/operations/hooks/useHandover';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';

interface Step2HandoverProps {
  roomId?: string;
  roomName?: string;
  contractId: string;
  tenantName?: string;
  /** HandoverId đã tạo (DRAFT hoặc CONFIRMED) */
  handoverId?: string;
  onBack: () => void;
  /** Chỉ gọi khi handover đã CONFIRMED */
  onNext: (handoverId: string) => void;
}

// ─── Pending Confirmation View ────────────────────────────────────────────────

function PendingConfirmation({
  handoverId,
  isManager,
  onConfirmed,
  onBack,
}: {
  handoverId: string;
  isManager: boolean;
  onConfirmed: () => void;
  onBack: () => void;
}) {
  const { useHandoverDetails, confirmHandover } = useHandover();
  const { data: handover, refetch, isFetching } = useHandoverDetails(handoverId);
  const [confirming, setConfirming] = useState(false);

  const isConfirmed = handover?.status === 'CONFIRMED' || handover?.status === 'COMPLETED';

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirmHandover.mutateAsync(handoverId);
      toast.success('Đã xác nhận biên bản bàn giao');
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể xác nhận biên bản';
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Status card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-[12px] border text-center flex flex-col items-center gap-3 ${
          isConfirmed
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
        }`}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
          isConfirmed
            ? 'bg-emerald-100 dark:bg-emerald-500/20'
            : 'bg-amber-100 dark:bg-amber-500/20'
        }`}>
          {isConfirmed
            ? <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            : <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />}
        </div>

        <div>
          <p className={`text-base font-black ${
            isConfirmed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
          }`}>
            {isConfirmed ? 'Biên bản đã được xác nhận' : 'Chờ Manager xác nhận biên bản'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Trạng thái hiện tại:{' '}
            <span className="font-bold font-mono">
              {handover?.status ?? '…'}
            </span>
          </p>
          {!isConfirmed && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              Biên bản bàn giao phải được Manager xác nhận trước khi tiếp tục thanh lý.
            </p>
          )}
        </div>
      </motion.div>

      {/* Manager: inline confirm button */}
      {isManager && !isConfirmed && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold text-center">
            Bạn là Manager. Xác nhận biên bản ngay tại đây:
          </p>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-[10px] transition-colors"
          >
            {confirming
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ShieldCheck className="w-4 h-4" />}
            {confirming ? 'Đang xác nhận…' : 'Xác nhận biên bản bàn giao'}
          </button>
        </div>
      )}

      {/* Staff: refresh button */}
      {!isManager && !isConfirmed && (
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
        >
          {isFetching
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />}
          {isFetching ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái'}
        </button>
      )}

      {/* Info notice for non-managers while pending */}
      {!isManager && !isConfirmed && (
        <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[10px]">
          <ClipboardList className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Nhờ Manager vào <strong>Vận hành → Biên bản Bàn giao</strong> để xác nhận biên bản trước khi tiếp tục.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-1">
        <PageBackButton
          onBack={onBack}
          className="rounded-[8px] border border-slate-200 px-4 py-2.5 font-black dark:border-slate-700"
        />

        {/* Next — chỉ active khi CONFIRMED */}
        <button
          onClick={onConfirmed}
          disabled={!isConfirmed}
          title={!isConfirmed ? 'Cần Manager xác nhận biên bản trước' : ''}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-sm rounded-[8px] transition-colors"
        >
          Tiếp tục chốt số
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Step2Handover({
  roomId,
  roomName,
  contractId,
  tenantName,
  handoverId,
  onBack,
  onNext,
}: Step2HandoverProps) {
  const hasRole = useAuthStore((s) => s.hasRole);
  const isManager = hasRole(['Manager', 'Owner', 'Admin']);

  // Sau khi DRAFT được tạo → chuyển sang màn hình chờ/xác nhận
  const [createdId, setCreatedId] = useState<string | undefined>(handoverId);

  const handleSubmitted = (id: string) => {
    setCreatedId(id);
  };

  // Nếu đã có handoverId (kể cả từ trước) → vào màn chờ xác nhận
  if (createdId) {
    return (
      <PendingConfirmation
        handoverId={createdId}
        isManager={isManager}
        onConfirmed={() => onNext(createdId)}
        onBack={() => {
          // Nếu muốn cho phép quay về form → xóa createdId
          // Nhưng DRAFT đã tạo rồi không xóa được → chỉ quay về Step 1
          onBack();
        }}
      />
    );
  }

  // Chưa tạo → hiển thị form
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-[10px]">
        <ClipboardList className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          Lập biên bản bàn giao phòng khi trả lại. Biên bản cần được Manager xác nhận
          trước khi tiếp tục chốt số và hoàn tất thanh lý.
        </p>
      </div>

      {/* Embedded form */}
      <HandoverForm
        mode="embedded"
        type="OUT"
        roomId={roomId}
        roomName={roomName}
        contractId={contractId}
        tenantName={tenantName}
        onSubmitted={handleSubmitted}
      />

      {/* Back */}
      <div className="flex justify-start pt-1">
        <PageBackButton
          onBack={onBack}
          className="rounded-[8px] border border-slate-200 px-4 py-2.5 font-black dark:border-slate-700"
        />
      </div>
    </div>
  );
}
