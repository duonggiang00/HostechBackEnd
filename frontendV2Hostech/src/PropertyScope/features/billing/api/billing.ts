import apiClient from '@/shared/api/client';
import type {
  Invoice,
  PaginatedInvoices,
  InvoiceQueryParams,
  GenerateMonthlyPayload,
  IssueInvoicePayload,
  RecordPaymentPayload,
  CancelInvoicePayload,
  CreateInvoicePayload,
} from '../types';

export const billingApi = {
  // ─── Danh sách hóa đơn theo Property ───────────────────────────────────
  getPropertyInvoices: async (
    propertyId: string,
    params?: InvoiceQueryParams,
  ): Promise<PaginatedInvoices> => {
    const response = await apiClient.get(`/properties/${propertyId}/invoices`, {
      params: {
        search: params?.search || undefined,
        'filter[status]': params?.status || undefined,
        'filter[room_id]': params?.room_id || undefined,
        page: params?.page ?? 1,
        per_page: params?.per_page ?? 20,
        include: 'property,room',
      },
    });
    return response.data as PaginatedInvoices;
  },

  // ─── Chi tiết hóa đơn ─────────────────────────────────────────────────
  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/invoices/${id}`, {
      params: {
        include: 'property,room,items,statusHistories.actor,createdBy,issuedBy',
      },
    });
    return response.data.data as Invoice;
  },

  // ─── Phát hành hóa đơn hàng tháng (generateMonthly) ─────────────────
  generateMonthly: async (
    propertyId: string,
    payload?: GenerateMonthlyPayload,
  ): Promise<{ message: string; count: number }> => {
    const response = await apiClient.post(
      `/properties/${propertyId}/invoices/generate-monthly`,
      payload,
    );
    return response.data;
  },

  // ─── Tạo hóa đơn thủ công ─────────────────────────────────────────────
  createInvoice: async (data: CreateInvoicePayload): Promise<Invoice> => {
    const response = await apiClient.post('/invoices', data);
    return response.data.data as Invoice;
  },

  // ─── Phát hành hóa đơn (DRAFT → ISSUED) ──────────────────────────────
  issueInvoice: async (id: string, payload?: IssueInvoicePayload): Promise<Invoice> => {
    const response = await apiClient.put(`/invoices/${id}/issue`, payload ?? {});
    return response.data.data as Invoice;
  },

  // ─── Ghi nhận thanh toán ──────────────────────────────────────────────
  recordPayment: async (
    id: string,
    payload: RecordPaymentPayload,
  ): Promise<{ message: string; invoice: Invoice }> => {
    const response = await apiClient.post(`/invoices/${id}/record-payment`, payload);
    return {
      message: response.data.message,
      invoice: response.data.invoice?.data ?? response.data.invoice,
    };
  },

  // ─── Hủy hóa đơn ──────────────────────────────────────────────────────
  cancelInvoice: async (id: string, payload?: CancelInvoicePayload): Promise<Invoice> => {
    const response = await apiClient.put(`/invoices/${id}/cancel`, payload ?? {});
    return response.data.data as Invoice;
  },

  // ─── Thanh toán nhanh (pay endpoint) ──────────────────────────────────
  payInvoice: async (
    invoiceId: string,
    payload: { payment_method: string; amount?: number; note?: string },
  ): Promise<any> => {
    const response = await apiClient.put(`/invoices/${invoiceId}/pay`, payload);
    return response.data;
  },
};
