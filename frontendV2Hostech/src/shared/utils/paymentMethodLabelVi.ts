/**
 * Nhãn tiếng Việt cho `payments.method` — khớp backend `App\Support\PaymentMethod::labelVi`.
 */
export function paymentMethodLabelVi(method: string | null | undefined): string {
  const m = String(method ?? '').toUpperCase();
  switch (m) {
    case 'CASH':
      return 'Tiền mặt';
    case 'BANK_TRANSFER':
    case 'TRANSFER':
      return 'Chuyển khoản';
    case 'VNPAY':
      return 'VNPay';
    case 'WALLET':
      return 'Ví điện tử';
    case 'QR':
      return 'Mã QR';
    default:
      return method && method !== '' ? method : '—';
  }
}
