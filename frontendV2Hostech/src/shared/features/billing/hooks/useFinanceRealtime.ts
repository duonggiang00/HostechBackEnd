import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '@/shared/utils/echo';
import {
  PAYMENT_VERIFICATIONS_QUERY_KEY,
  TENANT_PAYMENTS_QUERY_KEY,
} from '@/shared/features/billing/hooks/usePaymentVerification';
import { INVOICES_QUERY_KEY } from '@/shared/features/billing/hooks/useInvoice';

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

    const onInvoicePaid = (payload?: { invoice_id?: string }) => {
      invalidate();
      if (payload?.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ['invoices', payload.invoice_id] });
        queryClient.invalidateQueries({ queryKey: ['invoice', payload.invoice_id] });
      }
    };

    channel.listen('.payment.successfully_verified', invalidate);
    channel.listen('.invoice.paid', onInvoicePaid);

    return () => {
      channel.stopListening('.payment.successfully_verified');
      channel.stopListening('.invoice.paid');
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

    channel.listen('.payment.successfully_verified', invalidate);
    channel.listen('.invoice.paid', onInvoicePaid);

    return () => {
      channel.stopListening('.payment.successfully_verified');
      channel.stopListening('.invoice.paid');
    };
  }, [orgId, queryClient]);
}

/**
 * Kênh private `user.{id}` — tenant nhận `invoice.paid` khi là payer (theo backend InvoicePaidEvent).
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
    };

    channel.listen('.invoice.paid', onInvoicePaid);

    return () => {
      channel.stopListening('.invoice.paid');
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
