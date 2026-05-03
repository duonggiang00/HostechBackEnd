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

    channel.listen('.payment.successfully_verified', invalidate);
    channel.listen('.payment.proof_submitted', invalidate);
    channel.listen('.payment.rejected', invalidate);
    channel.listen('.invoice.paid', onInvoicePaid);
    channel.listen('.contract.activated', () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['property-rooms-simple', propertyId] });
    });
    channel.listen('.room_transfer.requested', onRoomTransferRequested);
    channel.listen('.contract.renewal_requested', onRoomTransferRequested);

    return () => {
      channel.stopListening('.payment.successfully_verified');
      channel.stopListening('.payment.proof_submitted');
      channel.stopListening('.payment.rejected');
      channel.stopListening('.invoice.paid');
      channel.stopListening('.contract.activated');
      channel.stopListening('.room_transfer.requested');
      channel.stopListening('.contract.renewal_requested');
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

    channel.listen('.payment.successfully_verified', invalidate);
    channel.listen('.invoice.paid', onInvoicePaid);
    channel.listen('.room_transfer.requested', onRoomTransferRequested);
    channel.listen('.contract.renewal_requested', onRoomTransferRequested);

    return () => {
      channel.stopListening('.payment.successfully_verified');
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

    channel.listen('.invoice.paid', onInvoicePaid);
    channel.listen('.payment.rejected', onPaymentRejected);

    // Listen for contract.activated on the user's model channel (broadcast by ContractActivated event)
    const modelChannel = echo.private(`App.Models.Org.User.${userId}`);
    const onContractActivated = (payload?: { contract?: { id?: string } }) => {
      queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
      if (payload?.contract?.id) {
        queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, payload.contract.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
      }
    };
    modelChannel.listen('.contract.activated', onContractActivated);

    return () => {
      channel.stopListening('.invoice.paid');
      channel.stopListening('.payment.rejected');
      modelChannel.stopListening('.contract.activated');
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
