import type { Contract } from '@/PropertyScope/features/contracts/types';
import type { Invoice } from '@/shared/features/billing/types';

/**
 * Map `contract.initial_invoice` (embed từ ContractResource) sang shape `Invoice`
 * để tái sử dụng SubmitPaymentProofModal trên màn tenant.
 */
export function contractInitialInvoiceAsInvoice(contract: Contract): Invoice | null {
  const inv = contract.initial_invoice;
  if (!inv?.id) {
    return null;
  }

  const total = Number(inv.total_amount ?? 0);
  const paid = Number(inv.paid_amount ?? 0);
  const debt =
    typeof inv.debt === 'number' && Number.isFinite(inv.debt)
      ? Math.max(0, inv.debt)
      : Math.max(0, total - paid);

  const code =
    inv.code ??
    `INV-${String(inv.id)
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase()}`;

  return {
    id: inv.id,
    code,
    org_id: contract.org_id,
    property_id: contract.property_id,
    room_id: contract.room_id ?? null,
    contract_id: contract.id,
    invoice_date: inv.due_date ?? null,
    due_date: inv.due_date ?? null,
    status: inv.status as Invoice['status'],
    total_amount: total,
    paid_amount: paid,
    debt,
    notes: null,
  };
}
