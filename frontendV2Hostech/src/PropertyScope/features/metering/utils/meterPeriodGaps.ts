import {
  areIntervalsOverlapping,
  eachMonthOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
  isAfter,
} from 'date-fns';
import type { Meter, MeterReading } from '../types';

/** Hợp đồng dùng để biết phòng có khách / phải chốt số trong từng tháng (lấy cả HĐ đã kết thúc). */
export interface ContractOccupancySlice {
  room_id: string;
  start_date: string;
  end_date?: string | null;
  status: string;
}

/** Chưa có hiệu lực thuê — không bắt buộc chốt số theo kỳ phòng trống */
const EXCLUDED_OCCUPANCY_STATUSES = new Set<string>([
  'DRAFT',
  'CANCELLED',
  'PENDING_SIGNATURE',
  'PENDING_PAYMENT',
]);

const FAR_FUTURE = new Date(8640000000000000);

function roomHadOccupancyInMonth(
  roomId: string,
  monthKey: string,
  contracts: ContractOccupancySlice[]
): boolean {
  const monthStart = startOfMonth(parseISO(`${monthKey}-01`));
  const monthEnd = endOfMonth(monthStart);

  for (const c of contracts) {
    if (c.room_id !== roomId || EXCLUDED_OCCUPANCY_STATUSES.has(c.status)) continue;
    if (!c.start_date) continue;
    const rangeStart = parseISO(c.start_date);
    const rangeEnd = c.end_date ? parseISO(c.end_date) : FAR_FUTURE;
    if (
      areIntervalsOverlapping(
        { start: monthStart, end: monthEnd },
        { start: rangeStart, end: rangeEnd },
        { inclusive: true }
      )
    ) {
      return true;
    }
  }
  return false;
}

/** Đã có bản ghi chốt số cho kỳ (chờ duyệt / đã duyệt / khóa). */
const CLOSED_STATUSES = new Set<string>(['SUBMITTED', 'APPROVED', 'LOCKED']);

export interface MeterPeriodGap {
  monthKey: string;
  /** Hiển thị kiểu MM/yy */
  monthLabel: string;
  roomLabels: string[];
}

function monthKeyFromPeriodStart(periodStart: string): string {
  return format(startOfMonth(parseISO(periodStart)), 'yyyy-MM');
}

function roomLabelFromMeter(meter: Meter): string {
  const r = meter.room;
  const name = r?.name?.trim();
  const code = r?.code?.trim();
  if (name) return name;
  if (code) return code;
  return meter.code?.trim() || meter.id;
}

/**
 * Các kỳ (tháng) trong quá khứ mà đồng hồ đang hoạt động chưa có chốt số ở trạng thái hợp lệ.
 * Không kiểm tra kỳ trùng **tháng hiện tại** (theo lịch) — chỉ các kỳ **trước** tháng hiện tại.
 * Cửa sổ tối đa 24 tháng kết thúc ở tháng liền trước.
 *
 * **Neo kỳ kiểm tra theo chỉ số:** tháng bắt đầu bắt buộc chốt = tháng của bản ghi đóng (SUBMITTED/APPROVED/LOCKED)
 * **sớm nhất** theo `period_start`. Chưa có chỉ số đóng thì dùng `installed_at`, rồi `created_at`.
 *
 * **Hợp đồng (tuỳ chọn):** nếu truyền `occupancyContracts`, chỉ báo thiếu chốt cho **tháng mà phòng có HĐ hiệu lực**
 * (giao nhau kỳ). Kỳ phòng trống / chưa có HĐ không vào danh sách. Đồng hồ tổng / không `room_id`: không lọc theo HĐ.
 */
export function computeMeterPeriodGaps(
  meters: Meter[],
  readings: MeterReading[],
  now: Date = new Date(),
  occupancyContracts?: ContractOccupancySlice[]
): MeterPeriodGap[] {
  const currentCalendarMonth = startOfMonth(now);
  /** Tháng mới nhất cần đủ chốt số = tháng trước tháng hiện tại */
  const endMonth = subMonths(currentCalendarMonth, 1);
  const windowStart = subMonths(endMonth, 23);

  const closedMonthsByMeter = new Map<string, Set<string>>();
  /** Tháng đầu tiên (đầu tháng) có chỉ số đóng — neo theo dữ liệu reading, không dùng created_at của meter */
  const earliestClosedMonthByMeter = new Map<string, Date>();

  for (const r of readings) {
    const mid = r.meter_id || r.meter?.id;
    if (!mid || !r.period_start || !CLOSED_STATUSES.has(r.status)) continue;
    const mk = monthKeyFromPeriodStart(r.period_start);
    let set = closedMonthsByMeter.get(mid);
    if (!set) {
      set = new Set();
      closedMonthsByMeter.set(mid, set);
    }
    set.add(mk);

    const monthDate = startOfMonth(parseISO(r.period_start));
    const prevEarliest = earliestClosedMonthByMeter.get(mid);
    if (!prevEarliest || monthDate < prevEarliest) {
      earliestClosedMonthByMeter.set(mid, monthDate);
    }
  }

  const gapsByMonth = new Map<string, Set<string>>();

  for (const meter of meters) {
    if (!meter.is_active) continue;

    const earliestFromReading = earliestClosedMonthByMeter.get(meter.id);
    const fallbackMonth = meter.installed_at
      ? startOfMonth(parseISO(meter.installed_at))
      : meter.created_at
        ? startOfMonth(parseISO(meter.created_at))
        : windowStart;

    /** Có chỉ số đóng → bắt buộc từ tháng của kỳ đó; chưa có → từ ngày lắp / tạo */
    const operationalStart = earliestFromReading ?? fallbackMonth;
    const meterStart = isAfter(operationalStart, windowStart) ? operationalStart : windowStart;
    if (isAfter(meterStart, endMonth)) continue;

    const months = eachMonthOfInterval({ start: meterStart, end: endMonth });
    const closed = closedMonthsByMeter.get(meter.id) ?? new Set();
    const label = roomLabelFromMeter(meter);

    for (const mDate of months) {
      const mk = format(mDate, 'yyyy-MM');
      if (occupancyContracts !== undefined && meter.room_id) {
        if (!roomHadOccupancyInMonth(meter.room_id, mk, occupancyContracts)) {
          continue;
        }
      }
      if (!closed.has(mk)) {
        let rooms = gapsByMonth.get(mk);
        if (!rooms) {
          rooms = new Set();
          gapsByMonth.set(mk, rooms);
        }
        rooms.add(label);
      }
    }
  }

  return Array.from(gapsByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, rooms]) => ({
      monthKey,
      monthLabel: format(parseISO(`${monthKey}-01`), 'MM/yy'),
      roomLabels: Array.from(rooms).sort((x, y) => x.localeCompare(y, 'vi')),
    }));
}
