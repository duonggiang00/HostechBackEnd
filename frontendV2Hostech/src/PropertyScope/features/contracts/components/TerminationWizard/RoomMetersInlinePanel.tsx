import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { AlertCircle, CheckCircle2, Droplet, Loader2, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { roomsApi } from '@/PropertyScope/features/rooms/api/rooms';
import { meteringApi } from '@/PropertyScope/features/metering/api/metering';
import { READING_CHAIN_STATUSES } from '@/PropertyScope/features/metering/utils/deriveNextReadingPeriod';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

type Props = {
  propertyId: string;
  roomId: string;
  /** `yyyy-MM-dd` — đồng bộ kỳ chốt số theo tháng của ngày này (vd. ngày chuyển phòng). */
  periodAnchorDate?: string;
};

/** Đồng hồ phòng từ API (MeterResource + quan hệ). */
type RoomMeterRow = {
  id: string;
  code?: string;
  type: string;
  is_active?: boolean;
  base_reading?: number;
  /** Số chỉ từ chỉ số APPROVED mới nhất (invoice-eligible) hoặc base_reading — từ MeterResource. */
  latest_reading?: number;
  consumption?: number;
  latest_approved_reading?: { reading_value?: number; status?: string } | null;
  /** Chỉ có khi API load `meters.latestReading` (Room show đã eager-load). */
  latest_period_reading?: {
    reading_value?: number;
    status?: string;
    period_start?: string;
    period_end?: string;
    /** Tiêu thụ kỳ của đúng bản ghi latestReading (khớp kỳ với period_start/end) */
    consumption?: number | null;
  } | null;
};

function readFiniteInt(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (c === null || c === undefined || c === '') continue;
    const n = Number(c);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return 0;
}

/** Mốc “số cũ” giống Quick Reading: ưu tiên bản kỳ mới nhất (SUBMITTED/APPROVED/LOCKED), rồi scalar latest_reading, rồi base. */
function baselineReadingValue(meter: RoomMeterRow & Record<string, unknown>): number {
  const lp = (meter.latest_period_reading ?? meter.latestPeriodReading) as RoomMeterRow['latest_period_reading'] | undefined;
  if (lp?.reading_value != null && lp.status) {
    const st = String(lp.status).toUpperCase();
    if (READING_CHAIN_STATUSES.has(st)) {
      return readFiniteInt(lp.reading_value);
    }
  }
  const approved = (meter.latest_approved_reading ?? meter.latestApprovedReading) as { reading_value?: unknown } | null | undefined;
  if (approved?.reading_value != null) {
    return readFiniteInt(approved.reading_value);
  }
  return readFiniteInt(
    meter.latest_reading,
    meter.latestReading,
    meter.base_reading,
    meter.baseReading,
  );
}

function sliceDateKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

/** Tiêu thụ từ chỉ số đúng kỳ (`latest_period_reading` khi trùng kỳ chọn) — không dùng `meter.consumption` (theo `latestInvoiceEligibleReading`, có thể khác kỳ). */
function consumptionFromPeriodReading(
  meter: RoomMeterRow & Record<string, unknown>,
  periodStart: string,
  periodEnd: string,
): number | null {
  const lp = (meter.latest_period_reading ?? meter.latestPeriodReading) as {
    period_start?: string;
    period_end?: string;
    consumption?: unknown;
  } | null | undefined;
  if (
    !lp ||
    sliceDateKey(lp.period_start) !== sliceDateKey(periodStart) ||
    sliceDateKey(lp.period_end) !== sliceDateKey(periodEnd)
  ) {
    return null;
  }
  if (lp.consumption === null || lp.consumption === undefined || lp.consumption === '') {
    return null;
  }
  const n = Number(lp.consumption);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}

/** Đã có chỉ số APPROVED/LOCKED trùng kỳ chọn → không cần chốt lại */
function isPeriodSealedOnMeter(
  meter: RoomMeterRow & Record<string, unknown>,
  periodStart: string,
  periodEnd: string,
): boolean {
  const lp = (meter.latest_period_reading ?? meter.latestPeriodReading) as {
    status?: string;
    period_start?: string;
    period_end?: string;
  } | null | undefined;
  if (!lp?.status) return false;
  const st = String(lp.status).toUpperCase();
  if (st !== 'APPROVED' && st !== 'LOCKED') return false;
  return (
    sliceDateKey(lp.period_start) === sliceDateKey(periodStart) &&
    sliceDateKey(lp.period_end) === sliceDateKey(periodEnd)
  );
}

export function RoomMetersInlinePanel({ propertyId, roomId, periodAnchorDate }: Props) {
  const queryClient = useQueryClient();
  const canFinalize = useAuthStore((s) => s.hasRole(['Manager', 'Owner', 'Admin']));

  const anchorMonthBounds = useMemo(() => {
    if (!periodAnchorDate || periodAnchorDate.length < 10) return null;
    const d = new Date(periodAnchorDate.slice(0, 10));
    if (Number.isNaN(d.getTime())) return null;
    return {
      start: format(startOfMonth(d), 'yyyy-MM-dd'),
      end: format(endOfMonth(d), 'yyyy-MM-dd'),
    };
  }, [periodAnchorDate]);

  const [periodStart, setPeriodStart] = useState(
    () => anchorMonthBounds?.start ?? format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  );
  const [periodEnd, setPeriodEnd] = useState(
    () => anchorMonthBounds?.end ?? format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  );
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!anchorMonthBounds) return;
    setPeriodStart(anchorMonthBounds.start);
    setPeriodEnd(anchorMonthBounds.end);
  }, [anchorMonthBounds]);

  const { data: room, isLoading, error, refetch } = useQuery({
    queryKey: ['room', roomId, propertyId, 'termination-meters'],
    /** Chi tiết phòng luôn eager-load meters + relations ở server; không phụ thuộc query `include`. */
    queryFn: () => roomsApi.getRoom(roomId),
    enabled: Boolean(roomId),
    staleTime: 15_000,
  });

  const meters = useMemo(() => {
    const list = ((room?.meters ?? []) as RoomMeterRow[]).filter((m) => m?.is_active !== false);
    return list;
  }, [room?.meters]);

  useEffect(() => {
    if (!meters.length) return;
    setValues((prev) => {
      const next = { ...prev };
      for (const m of meters) {
        if (next[m.id] === undefined) {
          const v = baselineReadingValue(m);
          next[m.id] = v > 0 ? String(Math.round(v)) : '';
        }
      }
      return next;
    });
  }, [meters]);

  const finalizeMutation = useMutation({
    mutationFn: () => {
      const readings = meters
        .map((m) => ({
          meter_id: m.id,
          reading_value: Math.round(Number(values[m.id])),
        }))
        .filter((r) => Number.isFinite(r.reading_value) && !Number.isNaN(r.reading_value));

      if (readings.length !== meters.length) {
        return Promise.reject(new Error('Vui lòng nhập chỉ số cho tất cả đồng hồ.'));
      }

      for (const m of meters) {
        const v = Math.round(Number(values[m.id]));
        const prev = baselineReadingValue(m);
        if (v < prev) {
          return Promise.reject(
            new Error(`Chỉ số ${m.code ?? m.id} (${m.type === 'ELECTRIC' ? 'Điện' : 'Nước'}) không được nhỏ hơn mốc hiện tại (${prev}).`),
          );
        }
      }

      return meteringApi.finalizeRoomReadingsApproved(roomId, {
        period_start: periodStart,
        period_end: periodEnd,
        readings,
      });
    },
    onSuccess: () => {
      toast.success('Đã chốt chỉ số — trạng thái Đã duyệt.');
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      void queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'response' in e
            ? (() => {
                const r = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
                  .response?.data;
                if (r?.errors) {
                  return Object.values(r.errors)
                    .flat()
                    .join(' ');
                }
                return r?.message;
              })()
            : undefined;
      toast.error(msg || 'Không lưu được chỉ số.');
    },
  });

  const periodFullySealed =
    meters.length > 0 && meters.every((m) => isPeriodSealedOnMeter(m, periodStart, periodEnd));

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Đang tải đồng hồ phòng…
      </div>
    );
  }

  if (error || !room) {
    return (
      <p className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Không tải được đồng hồ. Kiểm tra quyền hoặc thử lại sau.
      </p>
    );
  }

  if (meters.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Phòng chưa gắn đồng hồ điện/nước. Bước sau vẫn có thể lập hóa đơn chỉ từ dịch vụ tay nếu cần.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-600 dark:text-slate-400">
        Nhập chỉ số cuối kỳ và bấm lưu — hệ thống ghi nhận trạng thái{' '}
        <strong className="font-semibold text-slate-800 dark:text-slate-200">Đã duyệt</strong> ngay (bỏ qua bước chờ
        duyệt), cùng nhãn trạng thái như trang chỉ số đồng hồ phòng. Chỉ Quản lý / Chủ sở hữu / Admin được thao tác tại
        đây.
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/40">
        <p className="mb-2 text-xs font-medium text-slate-500">Kỳ chốt số</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            disabled={!canFinalize || finalizeMutation.isPending}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            disabled={!canFinalize || finalizeMutation.isPending}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {meters.map((meter) => {
          const Icon = meter.type === 'ELECTRIC' ? Zap : Droplet;
          const label = meter.type === 'ELECTRIC' ? 'Điện' : 'Nước';
          const prev = baselineReadingValue(meter);
          const sealed = isPeriodSealedOnMeter(meter, periodStart, periodEnd);
          const lpMeta = (meter.latest_period_reading ?? (meter as Record<string, unknown>).latestPeriodReading) as {
            reading_value?: number;
            period_start?: string;
            period_end?: string;
          } | null | undefined;
          const approvedVal = lpMeta?.reading_value != null ? readFiniteInt(lpMeta.reading_value) : null;
          const raw = sealed && approvedVal != null ? String(approvedVal) : (values[meter.id] ?? '');
          const cur = Math.round(Number(raw));
          const usageDraft = Number.isFinite(cur) && raw !== '' ? Math.max(0, cur - prev) : null;
          const periodReadingConsumption = consumptionFromPeriodReading(meter, periodStart, periodEnd);
          const lpPeriodMatches =
            sliceDateKey(lpMeta?.period_start) === sliceDateKey(periodStart) &&
            sliceDateKey(lpMeta?.period_end) === sliceDateKey(periodEnd);
          const inputSyncedToLatestPeriodReading =
            !lpPeriodMatches ||
            approvedVal == null ||
            raw === '' ||
            Math.round(Number(raw)) === approvedVal;
          const showPeriodConsumptionFromApi =
            periodReadingConsumption != null && (sealed || inputSyncedToLatestPeriodReading);

          return (
            <div
              key={meter.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-950/40"
            >
              <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Icon className={`h-4 w-4 ${meter.type === 'ELECTRIC' ? 'text-amber-500' : 'text-sky-500'}`} aria-hidden />
                {label}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Mốc chỉ số (trước khi nhập)</p>
                  <p className="mt-0.5 font-medium tabular-nums text-slate-800 dark:text-slate-100">
                    {prev.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`meter-${meter.id}`}>
                    Chỉ số mới
                  </label>
                  <input
                    id={`meter-${meter.id}`}
                    type="number"
                    min={0}
                    step={1}
                    disabled={!canFinalize || finalizeMutation.isPending || sealed}
                    value={raw}
                    onChange={(e) => setValues((s) => ({ ...s, [meter.id]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900/80"
                  />
                  {showPeriodConsumptionFromApi && periodReadingConsumption != null ? (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Tiêu thụ kỳ (chỉ số kỳ này):{' '}
                      <span className="font-semibold tabular-nums">
                        {periodReadingConsumption.toLocaleString('vi-VN')}
                      </span>
                    </p>
                  ) : sealed && approvedVal != null ? (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Chỉ số đã chốt:{' '}
                      <span className="font-semibold tabular-nums">{approvedVal.toLocaleString('vi-VN')}</span>
                    </p>
                  ) : !sealed && usageDraft != null ? (
                    <p className="mt-1 text-xs text-slate-500">Tiêu thụ kỳ (nháp): {usageDraft.toLocaleString('vi-VN')}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {periodFullySealed ? (
          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-100">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Đã chốt số kỳ này — chỉ số trong kỳ đã chọn đã được duyệt.
          </div>
        ) : canFinalize ? (
          <button
            type="button"
            disabled={finalizeMutation.isPending}
            onClick={() => finalizeMutation.mutate()}
            className="inline-flex w-fit items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {finalizeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu…
              </>
            ) : (
              'Lưu và duyệt chỉ số (Đã duyệt)'
            )}
          </button>
        ) : (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Tài khoản của bạn không có quyền duyệt chỉ số tại đây. Vui lòng nhờ Quản lý chốt số.
          </p>
        )}
      </div>
    </div>
  );
}
