import { describe, it, expect } from 'vitest';
import {
  buildIssueInvoicePayload,
  buildPreviewQuery,
  buildSyncPayload,
  type TerminationFormValues,
} from './buildPayload';

const baseForm = (): TerminationFormValues => ({
  termination_date: '2026-05-01',
  cancellation_party: 'MUTUAL',
  cancellation_reason: '',
  waive_penalty: false,
  damage_fee_total: 0,
  billing_mode: 'combined',
  mid_month_rent_credit: 0,
});

describe('buildSyncPayload', () => {
  it('omits optional numeric credits when zero', () => {
    const p = buildSyncPayload(baseForm());
    expect(p.mid_month_rent_credit).toBeUndefined();
  });

  it('includes mid_month_rent_credit when positive', () => {
    const p = buildSyncPayload({ ...baseForm(), mid_month_rent_credit: 500_000 });
    expect(p.mid_month_rent_credit).toBe(500_000);
  });
});

describe('buildPreviewQuery', () => {
  it('serializes waive_penalty as 1/0 for GET query compatibility', () => {
    const q = buildPreviewQuery(baseForm());
    expect(q.waive_penalty).toBe(0);
    const q2 = buildPreviewQuery({ ...baseForm(), waive_penalty: true });
    expect(q2.waive_penalty).toBe(1);
  });
});

describe('buildIssueInvoicePayload', () => {
  it('omits additional_invoice_lines when empty', () => {
    const p = buildIssueInvoicePayload(baseForm(), []);
    expect(p.additional_invoice_lines).toBeUndefined();
  });

  it('includes additional_invoice_lines when provided', () => {
    const p = buildIssueInvoicePayload(baseForm(), [
      { description: 'Phí hư hỏng', amount: 500_000 },
    ]);
    expect(p.additional_invoice_lines).toEqual([{ description: 'Phí hư hỏng', amount: 500_000 }]);
  });
});
