import { addDays, endOfMonth, format, min, parseISO, startOfMonth } from 'date-fns';
import type { Meter } from '../types';

function parseLocalDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const day = iso.slice(0, 10);
  const d = parseISO(day);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Đã gửi hoặc đã chốt — chuỗi kỳ & mốc “số cũ” trên form chốt nhanh. */
export const READING_CHAIN_STATUSES = new Set(['SUBMITTED', 'APPROVED', 'LOCKED']);

/**
 * Mốc period_end dùng để xếp lịch kỳ chốt nhanh tiếp theo (từng đồng hồ).
 */
function schedulingPeriodEnd(m: Meter): string | null {
  const lp = m.latest_period_reading;
  if (lp?.period_end && lp.status && READING_CHAIN_STATUSES.has(lp.status)) {
    return lp.period_end;
  }
  return m.latest_approved_reading?.period_end ?? null;
}

/**
 * Kỳ chốt số tiếp theo (toàn tòa): ngày sau min( mốc cuối kỳ ) trên từng đồng hồ.
 * Mốc cuối kỳ = bản SUBMITTED / APPROVED / LOCKED mới nhất (theo period_end), hoặc chỉ duyệt nếu không có.
 */
export function deriveNextReadingPeriod(meters: Meter[]): {
  periodStart: string;
  periodEnd: string;
  minPreviousPeriodEnd: string | null;
} {
  const ends: Date[] = [];
  for (const m of meters) {
    const pe = schedulingPeriodEnd(m);
    const d = parseLocalDate(pe);
    if (d) ends.push(d);
  }

  if (ends.length === 0) {
    const now = new Date();
    return {
      periodStart: format(startOfMonth(now), 'yyyy-MM-dd'),
      periodEnd: format(endOfMonth(now), 'yyyy-MM-dd'),
      minPreviousPeriodEnd: null,
    };
  }

  const minEnd = min(ends);
  const nextStart = addDays(minEnd, 1);
  const nextEnd = endOfMonth(nextStart);

  return {
    periodStart: format(nextStart, 'yyyy-MM-dd'),
    periodEnd: format(nextEnd, 'yyyy-MM-dd'),
    minPreviousPeriodEnd: format(minEnd, 'yyyy-MM-dd'),
  };
}
