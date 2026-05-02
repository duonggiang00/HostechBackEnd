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
        'filter[contract_id]': params?.contract_id || undefined,
        'filter[is_termination]': params?.is_termination !== undefined ? (params.is_termination ? 1 : 0) : undefined,
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
        include: 'property,room,items,statusHistories.changedBy,createdBy,issuedBy',
      },
    });
    return response.data.data as Invoice;
  },

  // ─── Phát hành hóa đơn hàng tháng (generateMonthly) ─────────────────
  generateMonthly: async (
    propertyId: string,
    payload?: GenerateMonthlyPayload,
  ): Promise<{
    message: string;
    count: number;
    failed?: number;
    errors?: string[];
    total?: number;
  }> => {
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

  /** Tạo hóa đơn định kỳ cho một tòa (POST …/generate-monthly). */
  generateInvoices: async (args: {
    property_id: string;
    execution_date?: string;
    billing_date?: string;
  }): Promise<{
    message: string;
    count: number;
    failed?: number;
    errors?: string[];
    total?: number;
  }> => {
    const billing_date = args.billing_date ?? args.execution_date;
    const response = await apiClient.post(
      `/properties/${args.property_id}/invoices/generate-monthly`,
      billing_date ? { billing_date } : {},
    );
    return response.data;
  },
};
