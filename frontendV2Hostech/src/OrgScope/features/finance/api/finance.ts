import apiClient from '@/shared/api/client';
import type { Invoice, InvoiceItem, InvoiceAdjustment } from '@/shared/features/billing/types';

export const financeApi = {
  getInvoices: async (filters?: any) => {
    const response = await apiClient.get('/invoices', { params: filters });
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data.data as Invoice;
  },

  createInvoice: async (data: any) => {
    const response = await apiClient.post('/invoices', data);
    return response.data.data;
  },

  issueInvoice: async (id: string) => {
    const response = await apiClient.put(`/invoices/${id}/issue`);
    return response.data.data;
  },

  payInvoice: async (id: string, payload: { paid_amount?: number; paid_at?: string }) => {
    const response = await apiClient.put(`/invoices/${id}/pay`, payload);
    return response.data.data;
  },

  cancelInvoice: async (id: string, reason?: string) => {
    const response = await apiClient.put(`/invoices/${id}/cancel`, { reason });
    return response.data.data;
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
};
