import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

type Part = number | '';

function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [ys, ms, ds] = iso.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return { y, m, d };
}

function toIso(y: number, m: number, d: number): string {
  const last = new Date(y, m, 0).getDate();
  const day = Math.min(Math.max(1, d), last);
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/** Số ngày tối đa của tháng `m` (1–12) khi chưa biết năm (dùng cho dropdown: 2→29, 4/6/9/11→30). */
function maxDayWithoutYear(m: number): number {
  if (m === 2) return 29;
  if ([4, 6, 9, 11].includes(m)) return 30;
  return 31;
}

export type BirthDateVariant = 'contract' | 'rounded';

type Props = {
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  variant?: BirthDateVariant;
  idPrefix?: string;
};

const selectBase: Record<BirthDateVariant, string> = {
  contract:
    'border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-1 py-0.5 text-sm text-indigo-900 dark:text-indigo-200 outline-none focus:border-indigo-600 rounded-sm min-w-[3.25rem]',
  rounded:
    'rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 px-2 py-2 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[4rem]',
};

/**
 * Ngày sinh: 3 ô chọn ngày / tháng / năm, giá trị gửi form là chuỗi yyyy-MM-dd (hoặc rỗng).
 */
export function BirthDateDayMonthYear({
  value,
  onChange,
  disabled = false,
  variant = 'contract',
  idPrefix = 'dob',
}: Props) {
  const [dd, setDd] = useState<Part>('');
  const [mm, setMm] = useState<Part>('');
  const [yy, setYy] = useState<Part>('');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const p = parseIsoDate((value || '').trim());
    if (p) {
      setDd(p.d);
      setMm(p.m);
      setYy(p.y);
    } else {
      setDd('');
      setMm('');
      setYy('');
    }
  }, [value]);

  const maxDay = useMemo(() => {
    if (mm === '') return 31;
    const m = Number(mm);
    if (yy === '') return maxDayWithoutYear(m);
    return daysInMonth(Number(yy), m);
  }, [yy, mm]);

  /**
   * Đồng bộ ngày với tháng/năm (31 → tháng 30 ngày → 30; 31/29/30 → tháng 2 → 29 hoặc 28 nếu đã có năm;
   * chưa có năm thì tối đa 29 cho tháng 2).
   */
  useLayoutEffect(() => {
    if (dd === '' || mm === '') return;
    const m = Number(mm);
    if (!Number.isFinite(m) || m < 1 || m > 12) return;
    const d0 = typeof dd === 'number' ? dd : Number(dd);
    if (!Number.isFinite(d0) || d0 < 1) return;

    const last = yy === '' ? maxDayWithoutYear(m) : daysInMonth(Number(yy), m);
    if (d0 <= last) return;

    setDd(last);
    if (yy !== '') {
      const y = Number(yy);
      onChangeRef.current(toIso(y, m, last));
    }
  }, [dd, mm, yy]);

  const years = useMemo(() => {
    const yEnd = new Date().getFullYear();
    const yStart = yEnd - 100;
    const list: number[] = [];
    for (let y = yEnd; y >= yStart; y -= 1) list.push(y);
    return list;
  }, []);

  const dayOptions = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);

  const apply = useCallback(
    (nextDd: Part, nextMm: Part, nextYy: Part) => {
      if (nextYy === '' || nextMm === '' || nextDd === '') {
        setDd(nextDd);
        setMm(nextMm);
        setYy(nextYy);
        onChange('');
        return;
      }
      const y = Number(nextYy);
      const m = Number(nextMm);
      const last = daysInMonth(y, m);
      let d = Number(nextDd);
      if (d > last) d = last;
      setDd(d);
      setMm(m);
      setYy(y);
      onChange(toIso(y, m, d));
    },
    [onChange],
  );

  const sel = selectBase[variant];

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <select
        id={`${idPrefix}_day`}
        disabled={disabled}
        className={sel}
        value={dd === '' ? '' : String(dd)}
        onChange={(e) => {
          const v = e.target.value === '' ? '' : Number(e.target.value);
          apply(v === '' ? '' : v, mm, yy);
        }}
        aria-label="Ngày sinh — ngày"
      >
        <option value="">Ngày</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}_month`}
        disabled={disabled}
        className={sel}
        value={mm === '' ? '' : String(mm)}
        onChange={(e) => {
          const v = e.target.value === '' ? '' : Number(e.target.value);
          apply(dd, v === '' ? '' : v, yy);
        }}
        aria-label="Ngày sinh — tháng"
      >
        <option value="">Tháng</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}_year`}
        disabled={disabled}
        className={sel}
        value={yy === '' ? '' : String(yy)}
        onChange={(e) => {
          const v = e.target.value === '' ? '' : Number(e.target.value);
          apply(dd, mm, v === '' ? '' : v);
        }}
        aria-label="Ngày sinh — năm"
      >
        <option value="">Năm</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </span>
  );
}
