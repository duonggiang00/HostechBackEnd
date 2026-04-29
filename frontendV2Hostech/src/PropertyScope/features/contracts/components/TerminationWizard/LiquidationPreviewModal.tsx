import { useQuery } from '@tanstack/react-query';
import { X, Loader2, Scale } from 'lucide-react';
import { contractsApi } from '../../api/contracts';

interface LiquidationPreviewModalProps {
  open: boolean;
  onClose: () => void;
  contractId: string;
  terminationDate: string;
  cancellationParty: string;
  waivePenalty: boolean;
  damageFeeTotal: number;
}

function fmtVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export function LiquidationPreviewModal({
  open,
  onClose,
  contractId,
  terminationDate,
  cancellationParty,
  waivePenalty,
  damageFeeTotal,
}: LiquidationPreviewModalProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      'liquidation-preview',
      contractId,
      terminationDate,
      cancellationParty,
      waivePenalty,
      damageFeeTotal,
    ],
    queryFn: () =>
      contractsApi.getLiquidationPreview(contractId, {
        termination_date: terminationDate,
        cancellation_party: cancellationParty,
        waive_penalty: waivePenalty,
        damage_fee_total: damageFeeTotal,
      }),
    enabled: open && !!contractId,
  });

  const payload = data?.data;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[14px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[8px] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Xem trước quyết toán</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tiền cọc − (nợ cũ + phí tháng cuối)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-10 text-slate-500 gap-2 text-sm font-bold">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải số liệu…
            </div>
          ) : isError ? (
            <div className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              {(error as any)?.response?.data?.message ??
                'Không thể tải xem trước. Vui lòng thử lại.'}
              <button
                type="button"
                onClick={() => refetch()}
                className="block mt-3 text-xs font-black text-indigo-600 underline"
              >
                Thử lại
              </button>
            </div>
          ) : payload ? (
            <>
              <div className="space-y-2 text-sm">
                <Row label="Tổng tiền cọc (credit)" value={fmtVnd(Number(payload.tong_tien_coc ?? 0))} />
                <Row label="Tổng nợ hóa đơn cũ" value={fmtVnd(Number(payload.tong_no_cu ?? 0))} muted />
                <Row label="Phí tháng cuối (ước tính)" value={fmtVnd(Number(payload.phi_thanh_ly_cuoi ?? 0))} muted />
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
                  <Row
                    label="Số dư sau quyết toán"
                    value={fmtVnd(Number(payload.so_du_sau_quyet_toan ?? 0))}
                    emphasize
                  />
                </div>
              </div>

              {Array.isArray(payload.no_cu) && payload.no_cu.length > 0 && (
                <div>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Nợ theo FIFO</p>
                  <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    {payload.no_cu.map((row: any, idx: number) => (
                      <li key={row.invoice_id ?? idx} className="flex justify-between gap-2">
                        <span className="truncate">HĐ {row.period_start ?? row.invoice_id}</span>
                        <span className="font-mono font-bold">{fmtVnd(Number(row.outstanding ?? 0))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className={`rounded-[10px] px-3 py-2.5 text-xs font-black ${
                  payload.kich_ban === 'A'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : payload.kich_ban === 'B'
                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {payload.kich_ban === 'A' && (
                  <>Kịch bản A: Hoàn cọc dự kiến {fmtVnd(Number(payload.hoan_tra_du_kien ?? 0))}</>
                )}
                {payload.kich_ban === 'B' && (
                  <>Kịch bản B: Khách còn phải trả {fmtVnd(Number(payload.con_phai_thu ?? 0))}</>
                )}
                {payload.kich_ban === 'C' && <>Kịch bản C: Cấn trừ khớp, không dư nợ hoàn cọc</>}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  emphasize,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className={muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}>{label}</span>
      <span
        className={`font-mono font-black ${
          emphasize ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
