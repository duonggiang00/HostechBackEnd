import type {
  Contract,
  ContractCancellationParty,
  TerminationBillingMode,
  TerminationManualInvoiceLine,
  TerminationPreviewQuery,
  TerminationSyncPayload,
} from '../../types';

export type TerminationFormValues = {
  termination_date: string;
  cancellation_party: ContractCancellationParty;
  cancellation_reason: string;
  waive_penalty: boolean;
  damage_fee_total: number;
  billing_mode: TerminationBillingMode;
  mid_month_rent_credit: number;
};

export function defaultTerminationDateInput(contract: Contract): string {
  if (contract.expected_move_out_date) {
    return contract.expected_move_out_date.split('T')[0] ?? '';
  }
  return new Date().toISOString().split('T')[0] ?? '';
}

export function buildSyncPayload(
  f: TerminationFormValues,
): TerminationSyncPayload & { cancellation_reason?: string } {
  return {
    termination_date: f.termination_date || undefined,
    cancellation_party: f.cancellation_party,
    cancellation_reason: f.cancellation_reason.trim() || undefined,
    waive_penalty: f.waive_penalty,
    damage_fee_total: f.damage_fee_total,
    billing_mode: f.billing_mode,
    mid_month_rent_credit: f.mid_month_rent_credit > 0 ? f.mid_month_rent_credit : undefined,
  };
}

/** Payload POST issue-final-invoice gồm tham số sync + dòng điều chỉnh tay (nếu có). */
export function buildIssueInvoicePayload(
  f: TerminationFormValues,
  additionalLines: TerminationManualInvoiceLine[],
): TerminationSyncPayload & { cancellation_reason?: string } {
  const base = buildSyncPayload(f);
  const lines = additionalLines.filter(
    (row) => row.description.trim().length > 0 && Number.isFinite(row.amount) && Math.abs(row.amount) >= 0.0001,
  );
  if (!lines.length) {
    return base;
  }
  return { ...base, additional_invoice_lines: lines };
}

export function buildPreviewQuery(f: TerminationFormValues): TerminationPreviewQuery {
  const base = buildSyncPayload(f);
  return {
    ...base,
    // Axios serializes false to "false" which fails Laravel boolean validator in GET query params.
    waive_penalty: (f.waive_penalty ? 1 : 0) as unknown as boolean,
  };
}
