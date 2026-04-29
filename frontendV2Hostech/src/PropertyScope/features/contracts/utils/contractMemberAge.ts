import { differenceInYears, isValid, parse } from 'date-fns';

/** Tuổi (số năm đầy đủ) tại ngày tham chiếu `referenceIso` (yyyy-MM-dd). */
export function ageInYearsAtDate(dobIso: string, referenceIso: string): number | null {
  const d = dobIso?.trim();
  const r = referenceIso?.trim();
  if (!d || !r) return null;
  const dob = parse(d, 'yyyy-MM-dd', new Date());
  const ref = parse(r, 'yyyy-MM-dd', new Date());
  if (!isValid(dob) || !isValid(ref)) return null;
  return differenceInYears(ref, dob);
}

/** Người thuê chính: đủ 18 tại ngày bắt đầu hợp đồng. */
export function isAdultAtContractStart(
  dobIso: string | null | undefined,
  contractStartIso: string | null | undefined,
): boolean {
  const age = ageInYearsAtDate(dobIso?.trim() || '', contractStartIso?.trim() || '');
  if (age === null) return false;
  return age >= 18;
}

/**
 * Có bắt buộc CCCD hai mặt không.
 * - Primary: luôn true.
 * - Khác: nếu không có DOB hợp lệ → true; nếu < 18 tại start_date → false; ≥ 18 → true.
 */
export function requiresIdentityForMember(params: {
  isPrimary: boolean;
  dobIso: string | null | undefined;
  contractStartIso: string | null | undefined;
}): boolean {
  if (params.isPrimary) return true;
  const age = ageInYearsAtDate(
    (params.dobIso ?? '').trim(),
    (params.contractStartIso ?? '').trim(),
  );
  if (age === null) return true;
  return age >= 18;
}

export function isValidUuid(v: string | null | undefined): boolean {
  if (!v || typeof v !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
}
