import { useState } from 'react';
import { Zap, Droplets, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { useRoomMeters, useCreateAndApproveReading } from '@/PropertyScope/features/metering/hooks/useMeters';
import type { SubmittedMeterReading } from './types';
import type { Meter } from '@/PropertyScope/features/metering/types';
import { PageBackButton } from '@/shared/components/ui/PageBackButton';

interface Step2MeterReadingsProps {
  roomId: string;
  terminationDate: string;
  onBack: () => void;
  onNext: (readings: SubmittedMeterReading[]) => void;
}

interface MeterRowState {
  newValue: string;
  status: 'idle' | 'loading' | 'done' | 'error';
  errorMsg?: string;
  result?: SubmittedMeterReading;
}

function getMeterIcon(type: string) {
  if (type === 'ELECTRIC' || type.includes('ELECTRIC')) {
    return <Zap className="w-4 h-4 text-amber-500" />;
  }
  return <Droplets className="w-4 h-4 text-blue-500" />;
}

function getMeterLabel(type: string) {
  if (type === 'ELECTRIC' || type.includes('ELECTRIC')) return 'Điện';
  if (type === 'WATER' || type.includes('WATER')) return 'Nước';
  return type;
}

function getLastApprovedValue(meter: Meter): number | null {
  const r = (meter as any).latestApprovedReading ?? (meter as any).latest_approved_reading;
  return r ? (r.reading_value ?? null) : null;
}

export function Step2MeterReadings({ roomId, terminationDate, onBack, onNext }: Step2MeterReadingsProps) {
  const { data: meters = [], isLoading } = useRoomMeters(roomId);
  const createAndApprove = useCreateAndApproveReading();

  const [rowStates, setRowStates] = useState<Record<string, MeterRowState>>({});

  const setRow = (meterId: string, patch: Partial<MeterRowState>) => {
    setRowStates(prev => ({ ...prev, [meterId]: { ...prev[meterId], ...patch } }));
  };

  const periodStart = format(startOfMonth(new Date(terminationDate)), 'yyyy-MM-dd');
  const periodEnd = terminationDate;

  const handleSubmit = async (meter: Meter) => {
    const state = rowStates[meter.id];
    const rawVal = parseFloat(state?.newValue ?? '');
    if (isNaN(rawVal) || rawVal < 0) {
      setRow(meter.id, { status: 'error', errorMsg: 'Vui lòng nhập chỉ số hợp lệ.' });
      return;
    }

    const lastApproved = getLastApprovedValue(meter);
    if (lastApproved !== null && rawVal < lastApproved) {
      setRow(meter.id, { status: 'error', errorMsg: `Chỉ số mới (${rawVal}) không được nhỏ hơn chỉ số cũ (${lastApproved}).` });
      return;
    }

    setRow(meter.id, { status: 'loading', errorMsg: undefined });
    try {
      const approved = await createAndApprove.mutateAsync({
        meterId: meter.id,
        readingValue: rawVal,
        periodStart,
        periodEnd,
      });

      const prev = lastApproved ?? ((meter as any).base_reading ?? 0);
      const consumption = rawVal - prev;

      const submittedReading: SubmittedMeterReading = {
        meterId: meter.id,
        meterCode: meter.code,
        meterType: meter.type,
        prevValue: prev,
        currValue: rawVal,
        consumption,
        periodStart,
        periodEnd,
        readingId: (approved as any).id,
      };

      setRow(meter.id, { status: 'done', result: submittedReading });
    } catch (err: any) {
      setRow(meter.id, {
        status: 'error',
        errorMsg: err?.response?.data?.message || 'Lỗi khi ghi nhận chỉ số.',
      });
    }
  };

  const allDone = meters.length > 0 && meters.every(m => rowStates[m.id]?.status === 'done');

  const handleNext = () => {
    const readings = meters
      .map(m => rowStates[m.id]?.result)
      .filter(Boolean) as SubmittedMeterReading[];
    onNext(readings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (meters.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Không tìm thấy đồng hồ nào cho phòng này.
        </p>
        <p className="text-xs text-slate-400">Vui lòng kiểm tra lại cấu hình đồng hồ trước khi thanh lý.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header note */}
      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[10px]">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
          Bắt buộc ghi nhận và duyệt <strong>tất cả đồng hồ</strong> trước khi xác nhận thanh lý.
          Kỳ chốt số: <strong>{periodStart} → {periodEnd}</strong>
        </p>
      </div>

      {/* Meter rows */}
      <div className="space-y-3">
        {meters.map((meter) => {
          const state = rowStates[meter.id] ?? { newValue: '', status: 'idle' };
          const lastApproved = getLastApprovedValue(meter);
          const isDone = state.status === 'done';
          const isProcessing = state.status === 'loading';

          return (
            <div
              key={meter.id}
              className={`rounded-[12px] border p-4 transition-colors ${
                isDone
                  ? 'border-emerald-200 dark:border-emerald-700/40 bg-emerald-50/40 dark:bg-emerald-500/5'
                  : state.status === 'error'
                  ? 'border-rose-200 dark:border-rose-700/40 bg-rose-50/40 dark:bg-rose-500/5'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
              }`}
            >
              {/* Meter header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[8px] bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {getMeterIcon(meter.type)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {getMeterLabel(meter.type)} — {meter.code}
                    </p>
                    {lastApproved !== null && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Chỉ số cũ: <span className="font-bold">{lastApproved.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                </div>
                {isDone && (
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã chốt
                  </div>
                )}
              </div>

              {isDone ? (
                /* Done state — show summary */
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Chỉ số cũ', val: state.result!.prevValue.toLocaleString() },
                    { label: 'Chỉ số mới', val: state.result!.currValue.toLocaleString() },
                    { label: 'Tiêu thụ', val: `${state.result!.consumption.toLocaleString()} ${meter.type}` },
                  ].map(({ label, val }) => (
                    <div key={label} className="text-center p-2 rounded-[8px] bg-emerald-50 dark:bg-emerald-500/10">
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Input state */
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="number"
                      min={lastApproved ?? 0}
                      step="0.01"
                      placeholder={`Chỉ số mới${lastApproved !== null ? ` (> ${lastApproved})` : ''}`}
                      value={state.newValue ?? ''}
                      onChange={(e) => setRow(meter.id, { newValue: e.target.value, status: 'idle', errorMsg: undefined })}
                      disabled={isProcessing}
                      className="w-full px-3 py-2.5 text-sm font-bold rounded-[8px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] disabled:opacity-50 transition-colors"
                    />
                    {state.status === 'error' && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-bold">{state.errorMsg}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSubmit(meter)}
                    disabled={isProcessing || !state.newValue}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-[8px] transition-colors whitespace-nowrap"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {isProcessing ? 'Đang xử lý...' : 'Ghi nhận & Duyệt'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      {!allDone && (
        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
          Đã chốt {meters.filter(m => rowStates[m.id]?.status === 'done').length}/{meters.length} đồng hồ
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <PageBackButton
          onBack={onBack}
          className="rounded-[8px] border border-slate-200 px-4 py-2.5 font-black dark:border-slate-700"
        />
        <button
          onClick={handleNext}
          disabled={!allDone}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-[8px] transition-colors"
        >
          Tiếp theo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
