import apiClient from '@/shared/api/client';

export const billingApi = {
  payInvoice: async (invoiceId: string, payload: { payment_method: string; payment_date: string; amount: number; reference_number?: string }): Promise<any> => {
    const response = await apiClient.post(`invoices/${invoiceId}/pay`, payload);
    return response.data;
  },

  generateInvoices: async (payload: { execution_date?: string }): Promise<any> => {
    const response = await apiClient.post('invoices/generate', payload);
    return response.data;
  },
};
