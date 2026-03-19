import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi as billingApi } from '@/OrgScope/features/finance/api/finance';
import type { Invoice, InvoiceAdjustment, InvoiceItem } from '../types';

export type { Invoice, InvoiceAdjustment, InvoiceItem };

export function useInvoice() {
  const queryClient = useQueryClient();

  const useInvoices = (filters?: any) => useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => billingApi.getInvoices(filters),
  });

  const useInvoiceDetails = (id: string) => useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billingApi.getInvoice(id),
    enabled: !!id,
  });

  const createInvoice = useMutation({
    mutationFn: (data: any) => billingApi.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  const issueInvoice = useMutation({
    mutationFn: (id: string) => billingApi.issueInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    }
  });

  const payInvoice = useMutation({
    mutationFn: ({ id, paid_amount, paid_at }: { id: string; paid_amount?: number; paid_at?: string }) => 
      billingApi.payInvoice(id, { paid_amount, paid_at }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    }
  });

  const cancelInvoice = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      billingApi.cancelInvoice(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    }
  });

  const useAdjustments = (invoiceId: string) => useQuery({
    queryKey: ['invoice-adjustments', invoiceId],
    queryFn: () => billingApi.getAdjustments(invoiceId),
    enabled: !!invoiceId,
  });

  const createAdjustment = useMutation({
    mutationFn: ({ invoiceId, ...data }: { invoiceId: string; type: string; amount: number; reason: string }) => 
      billingApi.createAdjustment(invoiceId, data),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-adjustments', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    }
  });

  const approveAdjustment = useMutation({
    mutationFn: ({ invoiceId, adjustmentId }: { invoiceId: string; adjustmentId: string }) => 
      billingApi.approveAdjustment(invoiceId, adjustmentId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-adjustments', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    }
  });

  const deleteAdjustment = useMutation({
    mutationFn: ({ invoiceId, adjustmentId }: { invoiceId: string; adjustmentId: string }) => 
      billingApi.deleteAdjustment(invoiceId, adjustmentId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-adjustments', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    }
  });

  const useStatusHistory = (invoiceId: string) => useQuery({
    queryKey: ['invoice-history', invoiceId],
    queryFn: () => billingApi.getStatusHistory(invoiceId),
    enabled: !!invoiceId,
  });

  return {
    useInvoices,
    useInvoiceDetails,
    createInvoice,
    issueInvoice,
    payInvoice,
    cancelInvoice,
    useAdjustments,
    createAdjustment,
    approveAdjustment,
    deleteAdjustment,
    useStatusHistory,
  };
}
