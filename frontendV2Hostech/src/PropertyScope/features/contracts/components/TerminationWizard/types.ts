// TerminationWizard — shared state types

export interface TerminationWizardState {
  // ── Step 1 ──────────────────────────────────────────────────────────────
  terminationDate: string;
  cancellationParty: 'LANDLORD' | 'TENANT' | 'MUTUAL';
  reason: string;
  waivePenalty: boolean;
  refundRemainingRent: boolean;
  /** Phí hư hỏng / bồi thường ước tính (VND) — gửi kèm API thanh lý EDA */
  damageFeeTotal?: number;

  // ── Step 2 — Bàn giao phòng ────────────────────────────────────────────
  /** ID của Handover record đã tạo (DRAFT), sau khi staff submit biên bản */
  handoverId?: string;

  // ── Step 3 (populated after readings submitted) ─────────────────────────
  approvedReadings: SubmittedMeterReading[];
}

export interface SubmittedMeterReading {
  meterId: string;
  meterCode: string;
  meterType: string;
  prevValue: number;
  currValue: number;
  consumption: number;
  periodStart: string;
  periodEnd: string;
  readingId: string;
}
