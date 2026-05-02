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

  /** Sau bước chốt số điện/nước */
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
