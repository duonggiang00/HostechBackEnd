/**
 * Khi mở chi tiết biên lai, truyền `state.from` (pathname + search) để trang chi tiết
 * nút «Quay lại» đưa user về đúng màn hình nguồn (HĐ, sổ quỹ, wizard…).
 */
export type PaymentDetailLocationState = { from?: string };

export function paymentDetailReferrerState(pathname: string, search = ''): PaymentDetailLocationState {
  return { from: `${pathname}${search}` };
}

export function paymentDetailReturnPath(propertyId: string, fromState: unknown): string {
  if (!propertyId) return '/';
  const fallback = `/properties/${propertyId}/finance/payments`;
  if (typeof fromState !== 'string' || !fromState.startsWith('/')) return fallback;
  if (!fromState.startsWith(`/properties/${propertyId}/`)) return fallback;
  return fromState;
}
