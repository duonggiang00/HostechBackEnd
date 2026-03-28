import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi as billingApi } from '@/OrgScope/features/finance/api/finance';
import type {
  Invoice,
  InvoiceAdjustment,
  InvoiceItem,
  VnpayCreatePaymentPayload,
  VnpayCreatePaymentResponse,
  VnpayVerifyResponse,
} from '../types';

export type { Invoice, InvoiceAdjustment, InvoiceItem };

export const INVOICES_QUERY_KEY = 'invoices';
export const VNPAY_RETURN_QUERY_KEY = 'vnpay-return';

export function useInvoice() {
  const queryClient = useQueryClient();

  const useInvoices = (filters?: any) =>
    useQuery({
      queryKey: [INVOICES_QUERY_KEY, filters],
      queryFn: () => billingApi.getInvoices(filters),
    });

  const useInvoiceDetails = (id: string) =>
    useQuery({
      queryKey: ['invoice', id],
      queryFn: () => billingApi.getInvoice(id),
      enabled: !!id,
    });

  const useVerifyVnpayReturn = (txnRef?: string, callbackQuery?: string) =>
    useQuery<VnpayVerifyResponse>({
      queryKey: [VNPAY_RETURN_QUERY_KEY, txnRef, callbackQuery],
      queryFn: () => billingApi.verifyVnpayReturn(txnRef!, callbackQuery),
      enabled: !!txnRef,
      retry: false,
    });

  const createInvoice = useMutation({
    mutationFn: (data: any) => billingApi.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
    },
  });

  const issueInvoice = useMutation({
    mutationFn: (id: string) => billingApi.issueInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });

  const payInvoice = useMutation({
    mutationFn: ({ id, paid_amount, paid_at }: { id: string; paid_amount?: number; paid_at?: string }) =>
      billingApi.payInvoice(id, { paid_amount, paid_at }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });

  const cancelInvoice = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => billingApi.cancelInvoice(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });

  const createVnpayPayment = useMutation<VnpayCreatePaymentResponse, unknown, VnpayCreatePaymentPayload>({
    mutationFn: (payload) => billingApi.createVnpayPayment(payload),
  });

  const useAdjustments = (invoiceId: string) =>
    useQuery({
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
    },
  });

  const approveAdjustment = useMutation({
    mutationFn: ({ invoiceId, adjustmentId }: { invoiceId: string; adjustmentId: string }) =>
      billingApi.approveAdjustment(invoiceId, adjustmentId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-adjustments', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
  });

  const deleteAdjustment = useMutation({
    mutationFn: ({ invoiceId, adjustmentId }: { invoiceId: string; adjustmentId: string }) =>
      billingApi.deleteAdjustment(invoiceId, adjustmentId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-adjustments', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
  });

  const useStatusHistory = (invoiceId: string) =>
    useQuery({
      queryKey: ['invoice-history', invoiceId],
      queryFn: () => billingApi.getStatusHistory(invoiceId),
      enabled: !!invoiceId,
    });

  return {
    useInvoices,
    useInvoiceDetails,
    useVerifyVnpayReturn,
    createInvoice,
    issueInvoice,
    payInvoice,
    cancelInvoice,
    createVnpayPayment,
    useAdjustments,
    createAdjustment,
    approveAdjustment,
    deleteAdjustment,
    useStatusHistory,
  };
}
