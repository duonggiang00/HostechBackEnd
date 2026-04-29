import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billing';

export const useGenerateInvoices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { property_id: string; execution_date?: string; billing_date?: string }) => {
      return billingApi.generateInvoices(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms'] });
    },
  });
};
