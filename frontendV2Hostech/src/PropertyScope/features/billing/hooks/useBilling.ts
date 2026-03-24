import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billing';

export const usePayInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: any }) => {
      return billingApi.payInvoice(invoiceId, payload);
    },
    onSuccess: () => {
      // Invalidate relevant queries (e.g. rooms, dashboards, etc)
      queryClient.invalidateQueries({ queryKey: ['property-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms'] });
    },
  });
};

export const useGenerateInvoices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { execution_date?: string }) => {
      return billingApi.generateInvoices(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms'] });
    },
  });
};
