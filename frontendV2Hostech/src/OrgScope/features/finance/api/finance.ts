import apiClient from '@/shared/api/client';
import type {
  Invoice,
  InvoiceAdjustment,
  InvoiceItem,
  VnpayCreatePaymentPayload,
  VnpayCreatePaymentResponse,
  VnpayVerifyResponse,
} from '@/shared/features/billing/types';

const buildInvoiceCode = (invoice: any) => {
  if (invoice?.code) return String(invoice.code);

  const fallback = String(invoice?.id ?? '').slice(0, 8).toUpperCase();
  return fallback ? `INV-${fallback}` : 'INV-UNKNOWN';
};

const normalizeInvoiceItem = (item: any): InvoiceItem => ({
  id: item?.id,
  type: item?.type,
  name: item?.name || item?.description || 'Khoản phí',
  description: item?.description || item?.name || 'Khoản phí',
  quantity: Number(item?.quantity ?? 0),
  unit: item?.unit || '',
  price: Number(item?.price ?? item?.unit_price ?? 0),
  unit_price: Number(item?.unit_price ?? item?.price ?? 0),
  total: Number(item?.total ?? item?.amount ?? 0),
  amount: Number(item?.amount ?? item?.total ?? 0),
  meta: item?.meta ?? null,
});

const normalizeInvoice = (invoice: any): Invoice => {
  const total = Number(invoice?.total ?? invoice?.total_amount ?? 0);
  const paidAmount = Number(invoice?.paid_amount ?? 0);
  const property = invoice?.property
    ? {
        id: invoice.property.id,
        name: invoice.property.name,
        address: invoice.property.address,
        phone: invoice.property.phone,
      }
    : undefined;
  const room = invoice?.room
    ? {
        id: invoice.room.id,
        code: invoice.room.code,
        name: invoice.room.name,
      }
    : undefined;
  const tenant =
    invoice?.tenant ||
    (Array.isArray(invoice?.contract?.members) && invoice.contract.members.length > 0
      ? {
          id: invoice.contract.members.find((member: any) => member.is_primary)?.user_id ?? invoice.contract.members[0]?.user_id,
          name: invoice.contract.members.find((member: any) => member.is_primary)?.full_name ?? invoice.contract.members[0]?.full_name,
          room: room?.name || room?.code,
        }
      : undefined);

  return {
    id: String(invoice?.id ?? ''),
    code: buildInvoiceCode(invoice),
    org_id: invoice?.org_id,
    property_id: invoice?.property_id ?? property?.id ?? null,
    room_id: invoice?.room_id ?? room?.id ?? null,
    contract_id: invoice?.contract_id ?? invoice?.contract?.id ?? null,
    invoice_date: invoice?.invoice_date ?? invoice?.issue_date ?? null,
    issue_date: invoice?.issue_date ?? invoice?.invoice_date ?? null,
    due_date: invoice?.due_date ?? null,
    period_start: invoice?.period_start ?? null,
    period_end: invoice?.period_end ?? null,
    status: invoice?.status,
    subtotal: Number(invoice?.subtotal ?? invoice?.total_amount ?? total),
    tax: Number(invoice?.tax ?? 0),
    total,
    total_amount: Number(invoice?.total_amount ?? total),
    paid_amount: paidAmount,
    debt: Number(invoice?.debt ?? Math.max(0, total - paidAmount)),
    notes: invoice?.notes ?? invoice?.note ?? null,
    items: Array.isArray(invoice?.items) ? invoice.items.map(normalizeInvoiceItem) : [],
    tenant,
    property,
    room,
    contract: invoice?.contract
      ? {
          id: invoice.contract.id,
          status: invoice.contract.status,
        }
      : undefined,
  };
};

const normalizeInvoiceCollectionResponse = (payload: any) => ({
  ...payload,
  data: Array.isArray(payload?.data) ? payload.data.map(normalizeInvoice) : [],
});

const buildInvoiceParams = (filters?: any) => ({
  'filter[status]': filters?.status ?? filters?.['filter[status]'] ?? undefined,
  'filter[property_id]': filters?.property_id ?? filters?.['filter[property_id]'] ?? undefined,
  'filter[room_id]': filters?.room_id ?? filters?.['filter[room_id]'] ?? undefined,
  'filter[contract_id]': filters?.contract_id ?? filters?.['filter[contract_id]'] ?? undefined,
  search: filters?.search ?? undefined,
  sort: filters?.sort ?? undefined,
  page: filters?.page ?? undefined,
  per_page: filters?.per_page ?? undefined,
});

export const financeApi = {
  getInvoices: async (filters?: any) => {
    const response = await apiClient.get('/invoices', { params: buildInvoiceParams(filters) });
    return normalizeInvoiceCollectionResponse(response.data);
  },

  getInvoice: async (id: string) => {
    const response = await apiClient.get(`/invoices/${id}`);
    return normalizeInvoice(response.data.data) as Invoice;
  },

  createInvoice: async (data: any) => {
    const response = await apiClient.post('/invoices', data);
    return normalizeInvoice(response.data.data) as Invoice;
  },

  issueInvoice: async (id: string) => {
    const response = await apiClient.put(`/invoices/${id}/issue`);
    return normalizeInvoice(response.data.data) as Invoice;
  },

  payInvoice: async (id: string, payload: { paid_amount?: number; paid_at?: string }) => {
    const response = await apiClient.put(`/invoices/${id}/pay`, payload);
    return response.data;
  },

  cancelInvoice: async (id: string, reason?: string) => {
    const response = await apiClient.put(`/invoices/${id}/cancel`, { reason });
    return normalizeInvoice(response.data.data) as Invoice;
  },

  getAdjustments: async (invoiceId: string) => {
    const response = await apiClient.get(`/invoices/${invoiceId}/adjustments`);
    return response.data.data as InvoiceAdjustment[];
  },

  createAdjustment: async (invoiceId: string, data: { type: string; amount: number; reason: string }) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/adjustments`, data);
    return response.data.data;
  },

  approveAdjustment: async (invoiceId: string, adjustmentId: string) => {
    const response = await apiClient.put(`/invoices/${invoiceId}/adjustments/${adjustmentId}/approve`);
    return response.data.data;
  },

  deleteAdjustment: async (invoiceId: string, adjustmentId: string) => {
    await apiClient.delete(`/invoices/${invoiceId}/adjustments/${adjustmentId}`);
  },

  getStatusHistory: async (invoiceId: string) => {
    const response = await apiClient.get(`/invoices/${invoiceId}/histories`);
    return response.data.data;
  },

  createVnpayPayment: async (payload: VnpayCreatePaymentPayload) => {
    const response = await apiClient.post('/finance/vnpay/create', payload);
    return response.data as VnpayCreatePaymentResponse;
  },

  verifyVnpayReturn: async (txnRef: string, callbackQuery?: string) => {
    const params = new URLSearchParams(callbackQuery ?? '');
    if (txnRef && !params.get('txn_ref') && !params.get('vnp_TxnRef')) {
      params.set('txn_ref', txnRef);
    }

    const response = await apiClient.get('/finance/vnpay/verify', {
      params: Object.fromEntries(params.entries()),
    });
    return response.data as VnpayVerifyResponse;
  },
};
