import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { echo } from '@/shared/utils/echo';
import {
  PAYMENT_VERIFICATIONS_QUERY_KEY,
  TENANT_PAYMENTS_QUERY_KEY,
} from '@/shared/features/billing/hooks/usePaymentVerification';
import { INVOICES_QUERY_KEY } from '@/shared/features/billing/hooks/useInvoice';
import {
  CONTRACT_KEY,
  CONTRACTS_KEY,
  MY_CONTRACTS_KEY,
  PENDING_REQUESTS_KEY,
} from '@/PropertyScope/features/contracts/hooks/useContracts';

/**
 * Kênh private `property.{id}` — đồng bộ khi staff duyệt thanh toán / hóa đơn chuyển PAID (broadcast Laravel).
 */
export function usePropertyFinanceRealtime(propertyId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo || !propertyId) return;

    const channel = echo.private(`property.${propertyId}`);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: [PAYMENT_VERIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms-simple', propertyId] });
    };

    const onRoomTransferRequested = () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_REQUESTS_KEY, propertyId] });
      queryClient.invalidateQueries({ queryKey: [PENDING_REQUESTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
    };

    const onInvoicePaid = (payload?: { invoice_id?: string }) => {
      invalidate();
      if (payload?.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ['invoices', payload.invoice_id] });
        queryClient.invalidateQueries({ queryKey: ['invoice', payload.invoice_id] });
      }
    };

    const invalidateContracts = (payload?: { id?: string }) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
      if (payload?.id) {
        queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, payload.id] });
      }
    };

    const onContractActivated = (payload?: { id?: string }) => {
      invalidateContracts(payload);
      queryClient.invalidateQueries({ queryKey: ['property-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms-simple', propertyId] });
    };

    const onContractSignatureConfirmed = (payload?: { id?: string; role?: string }) => {
      invalidateContracts(payload);
      const who = payload?.role === 'tenant' ? 'Cư dân' : 'Quản lý';
      toast.success(`${who} vừa ký xác nhận hợp đồng.`, {
        id: `contract-sig-${payload?.id}-${payload?.role}`,
        duration: 5000,
      });
    };

    const onContractStatusChanged = (payload?: { id?: string; to_status?: string }) => {
      invalidateContracts(payload);
      queryClient.invalidateQueries({ queryKey: ['property-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms-simple', propertyId] });
      const labelMap: Record<string, string> = {
        PENDING_SIGNATURE: 'đang chờ ký',
        PENDING_TERMINATION: 'đang chờ thanh lý',
        TERMINATED: 'đã được thanh lý',
        EXPIRED: 'đã hết hạn',
        CANCELLED: 'đã bị hủy',
        PENDING_SETTLEMENT: 'đang chờ quyết toán nợ',
      };
      const label = payload?.to_status ? (labelMap[payload.to_status] ?? payload.to_status) : '';
      if (label) {
        toast(`Hợp đồng ${label}.`, { id: `contract-status-${payload?.id}`, duration: 5000 });
      }
    };

    const onTerminationEvent = (payload?: { id?: string; contract_id?: string }) => {
      const contractId = payload?.contract_id ?? payload?.id;
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contractId] });
      }
    };

    const onInvoiceGenerated = (payload?: { id?: string }) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (payload?.id) {
        queryClient.invalidateQueries({ queryKey: ['invoice', payload.id] });
      }
    };

    const onPaymentVoided = () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    };

    channel.listen('.payment.successfully_verified', invalidate);
    channel.listen('.payment.proof_submitted', invalidate);
    channel.listen('.payment.rejected', invalidate);
    channel.listen('.payment.voided', onPaymentVoided);
    channel.listen('.invoice.generated', onInvoiceGenerated);
    channel.listen('.invoice.paid', onInvoicePaid);
    channel.listen('.contract.activated', onContractActivated);
    channel.listen('.contract.pending_payment', invalidateContracts);
    channel.listen('.contract.signature_confirmed', onContractSignatureConfirmed);
    channel.listen('.contract.status_changed', onContractStatusChanged);
    channel.listen('.room_transfer.requested', onRoomTransferRequested);
    channel.listen('.contract.renewal_requested', onRoomTransferRequested);
    channel.listen('.contract.termination.initiated', onTerminationEvent);
    channel.listen('.contract.termination.handover_submitted', onTerminationEvent);
    channel.listen('.contract.termination.final_invoice_generated', onTerminationEvent);
    channel.listen('.contract.settlement.payment_required', onTerminationEvent);
    channel.listen('.contract.settlement.resolved', onTerminationEvent);
    channel.listen('.contract.termination.failed', onTerminationEvent);

    return () => {
      channel.stopListening('.payment.successfully_verified');
      channel.stopListening('.payment.proof_submitted');
      channel.stopListening('.payment.rejected');
      channel.stopListening('.payment.voided');
      channel.stopListening('.invoice.generated');
      channel.stopListening('.invoice.paid');
      channel.stopListening('.contract.activated');
      channel.stopListening('.contract.pending_payment');
      channel.stopListening('.contract.signature_confirmed');
      channel.stopListening('.contract.status_changed');
      channel.stopListening('.room_transfer.requested');
      channel.stopListening('.contract.renewal_requested');
      channel.stopListening('.contract.termination.initiated');
      channel.stopListening('.contract.termination.handover_submitted');
      channel.stopListening('.contract.termination.final_invoice_generated');
      channel.stopListening('.contract.settlement.payment_required');
      channel.stopListening('.contract.settlement.resolved');
      channel.stopListening('.contract.termination.failed');
    };
  }, [propertyId, queryClient]);
}

/**
 * Kênh private `org.{id}` — Owner/Manager xem tài chính cấp org (cùng broadcast với property).
 */
export function useOrgFinanceRealtime(orgId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo || !orgId) return;

    const channel = echo.private(`org.${orgId}`);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: [PAYMENT_VERIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    };

    const onInvoicePaid = (payload?: { invoice_id?: string }) => {
      invalidate();
      if (payload?.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ['invoices', payload.invoice_id] });
        queryClient.invalidateQueries({ queryKey: ['invoice', payload.invoice_id] });
      }
    };

    const onRoomTransferRequested = () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_REQUESTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
    };

    const onInvoiceGenerated = (payload?: { id?: string }) => {
      invalidate();
      if (payload?.id) {
        queryClient.invalidateQueries({ queryKey: ['invoices', payload.id] });
        queryClient.invalidateQueries({ queryKey: ['invoice', payload.id] });
      }
    };

    const onPaymentVoided = () => {
      invalidate();
    };

    channel.listen('.payment.successfully_verified', invalidate);
    channel.listen('.payment.proof_submitted', invalidate);
    channel.listen('.payment.voided', onPaymentVoided);
    channel.listen('.invoice.generated', onInvoiceGenerated);
    channel.listen('.invoice.paid', onInvoicePaid);
    channel.listen('.room_transfer.requested', onRoomTransferRequested);
    channel.listen('.contract.renewal_requested', onRoomTransferRequested);

    return () => {
      channel.stopListening('.payment.successfully_verified');
      channel.stopListening('.payment.proof_submitted');
      channel.stopListening('.payment.voided');
      channel.stopListening('.invoice.generated');
      channel.stopListening('.invoice.paid');
      channel.stopListening('.room_transfer.requested');
      channel.stopListening('.contract.renewal_requested');
    };
  }, [orgId, queryClient]);
}

/**
 * Kênh private `user.{id}` — tenant nhận:
 *  - `invoice.paid`     khi payment được duyệt
 *  - `payment.rejected` khi bằng chứng bị từ chối → hiển thị toast + reload data
 */
export function useTenantFinanceRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo || !userId) return;

    const channel = echo.private(`user.${userId}`);

    const onInvoicePaid = (payload?: { invoice_id?: string }) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TENANT_PAYMENTS_QUERY_KEY] });
      if (payload?.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ['invoice', payload.invoice_id] });
      }
      const id = payload?.invoice_id;
      toast.success(
        id
          ? `Thanh toán đã được xác nhận (hóa đơn đã cập nhật).`
          : 'Thanh toán đã được xác nhận.',
        { id: id ? `invoice-paid-${id}` : 'invoice-paid', duration: 5000 },
      );
    };

    const onPaymentRejected = (payload?: { reject_reason?: string; amount?: number }) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TENANT_PAYMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });

      const reason = payload?.reject_reason ? `: ${payload.reject_reason}` : '';
      toast.error(`Bằng chứng thanh toán của bạn đã bị từ chối${reason}. Vui lòng kiểm tra lại hóa đơn.`, {
        duration: 8000,
        id: 'payment-rejected',
      });
    };

    const onReceiptGenerated = (payload?: { receipt_id?: string; payment_id?: string; amount?: number }) => {
      queryClient.invalidateQueries({ queryKey: [TENANT_PAYMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      toast.success('Biên lai thanh toán của bạn đã sẵn sàng. Vui lòng kiểm tra lịch sử thanh toán.', {
        id: `receipt-generated-${payload?.receipt_id ?? payload?.payment_id}`,
        duration: 6000,
      });
    };

    channel.listen('.invoice.paid', onInvoicePaid);
    channel.listen('.payment.rejected', onPaymentRejected);
    channel.listen('.receipt.generated', onReceiptGenerated);

    // Termination pipeline events broadcast trên kênh user.{id} (TerminationBroadcastChannels)
    const onTerminationEvent = (payload?: { contract_id?: string }) => {
      queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
      if (payload?.contract_id) {
        queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, payload.contract_id] });
      }
    };

    const onSettlementResolved = (payload?: { contract_id?: string }) => {
      onTerminationEvent(payload);
      toast.success('Quyết toán hợp đồng đã hoàn tất. Vui lòng kiểm tra thông tin hoàn cọc.', {
        id: `settlement-resolved-${payload?.contract_id}`,
        duration: 8000,
      });
    };

    const onSettlementPaymentRequired = (payload?: { contract_id?: string; amount_due?: number }) => {
      onTerminationEvent(payload);
      const amount = payload?.amount_due
        ? ` (${new Intl.NumberFormat('vi-VN').format(payload.amount_due)}đ)`
        : '';
      toast.error(`Yêu cầu thanh toán nợ quyết toán${amount}. Vui lòng kiểm tra hóa đơn.`, {
        id: `settlement-payment-${payload?.contract_id}`,
        duration: 8000,
      });
    };

    channel.listen('.contract.termination.initiated', onTerminationEvent);
    channel.listen('.contract.settlement.payment_required', onSettlementPaymentRequired);
    channel.listen('.contract.settlement.resolved', onSettlementResolved);

    // Contract status + signature events broadcast trên kênh App.Models.Org.User.{id}
    const modelChannel = echo.private(`App.Models.Org.User.${userId}`);

    const invalidateContracts = (id?: string) => {
      queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, id] });
      }
    };

    const onContractActivated = (payload?: { id?: string; contract?: { id?: string } }) => {
      const id = payload?.id ?? payload?.contract?.id;
      invalidateContracts(id);
    };

    const onContractPendingPayment = (payload?: { id?: string }) => {
      invalidateContracts(payload?.id);
      toast('Hợp đồng của bạn đã sẵn sàng. Vui lòng thanh toán để kích hoạt.', {
        id: `contract-pending-payment-${payload?.id}`,
        duration: 7000,
      });
    };

    const onContractSignatureConfirmed = (payload?: { id?: string; role?: string }) => {
      invalidateContracts(payload?.id);
      if (payload?.role === 'manager') {
        toast.success('Quản lý đã ký xác nhận hợp đồng của bạn.', {
          id: `contract-sig-manager-${payload?.id}`,
          duration: 6000,
        });
      }
    };

    const onContractStatusChanged = (payload?: { id?: string; to_status?: string }) => {
      invalidateContracts(payload?.id);
      const labelMap: Record<string, string> = {
        PENDING_SIGNATURE: 'đang chờ ký — vui lòng ký xác nhận',
        PENDING_TERMINATION: 'đang chờ thanh lý',
        TERMINATED: 'đã được thanh lý',
        EXPIRED: 'đã hết hạn',
        CANCELLED: 'đã bị hủy',
        PENDING_SETTLEMENT: 'đang chờ quyết toán nợ',
      };
      const label = payload?.to_status ? (labelMap[payload.to_status] ?? null) : null;
      if (label) {
        toast(`Hợp đồng của bạn ${label}.`, {
          id: `contract-status-${payload?.id}`,
          duration: 7000,
        });
      }
    };

    // invoice.generated broadcast lên App.Models.Org.User.{id} khi BQL phát hành hóa đơn mới
    const onInvoiceGenerated = (payload?: { id?: string; total_amount?: number; period_start?: string; period_end?: string }) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
      if (payload?.id) {
        queryClient.invalidateQueries({ queryKey: ['invoice', payload.id] });
      }
      const amount = payload?.total_amount
        ? ` (${new Intl.NumberFormat('vi-VN').format(payload.total_amount)}đ)`
        : '';
      toast(`Bạn có hóa đơn mới${amount}. Vui lòng kiểm tra và thanh toán đúng hạn.`, {
        id: `invoice-generated-${payload?.id}`,
        duration: 7000,
      });
    };

    modelChannel.listen('.contract.activated', onContractActivated);
    modelChannel.listen('.contract.pending_payment', onContractPendingPayment);
    modelChannel.listen('.contract.signature_confirmed', onContractSignatureConfirmed);
    modelChannel.listen('.contract.status_changed', onContractStatusChanged);
    modelChannel.listen('.invoice.generated', onInvoiceGenerated);

    return () => {
      channel.stopListening('.invoice.paid');
      channel.stopListening('.payment.rejected');
      channel.stopListening('.receipt.generated');
      channel.stopListening('.contract.termination.initiated');
      channel.stopListening('.contract.settlement.payment_required');
      channel.stopListening('.contract.settlement.resolved');
      modelChannel.stopListening('.contract.activated');
      modelChannel.stopListening('.contract.pending_payment');
      modelChannel.stopListening('.contract.signature_confirmed');
      modelChannel.stopListening('.contract.status_changed');
      modelChannel.stopListening('.invoice.generated');
    };
  }, [userId, queryClient]);
}

/** Query key dùng chung với `TenantMeterModal` (GET /app/meters). */
export const TENANT_METERS_QUERY_KEY = 'tenant-app-meters';

/**
 * Khi BQL duyệt chỉ số, backend broadcast tới `App.Models.User.{id}` và/hoặc `user.{id}`.
 * Làm mới modal/query chỉ số chỉ đọc của cư dân.
 */
export function useTenantMeterRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo || !userId) return;

    const refreshMeters = () => {
      queryClient.invalidateQueries({ queryKey: [TENANT_METERS_QUERY_KEY] });
    };

    const orgUserChannel = echo.private(`App.Models.User.${userId}`);
    orgUserChannel.listen('.meter-reading.approved', refreshMeters);
    orgUserChannel.listen('.meter-readings.bulk_approved', refreshMeters);

    const userChannel = echo.private(`user.${userId}`);
    userChannel.listen('.meter-reading.approved', refreshMeters);
    userChannel.listen('.meter-readings.bulk_approved', refreshMeters);
    userChannel.listen('.App.Events.Meter.MeterReadingStatusChanged', refreshMeters);

    return () => {
      orgUserChannel.stopListening('.meter-reading.approved');
      orgUserChannel.stopListening('.meter-readings.bulk_approved');
      userChannel.stopListening('.meter-reading.approved');
      userChannel.stopListening('.meter-readings.bulk_approved');
      userChannel.stopListening('.App.Events.Meter.MeterReadingStatusChanged');
    };
  }, [userId, queryClient]);
}
