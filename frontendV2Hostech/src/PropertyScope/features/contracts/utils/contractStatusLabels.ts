/**
 * Nhãn tiếng Việt cho `Contract.status` (API trả enum SCREAMING_SNAKE).
 * Dùng làm fallback khi không có map màu/badge riêng.
 */
export const CONTRACT_STATUS_LABELS_VI: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_SIGNATURE: 'Chờ ký',
  PENDING_PAYMENT: 'Chờ thanh toán',
  ACTIVE: 'Hiệu lực',
  PENDING_TERMINATION: 'Chờ thanh lý',
  /** Trạng thái cũ / tương thích: chờ thu đủ nợ quyết toán sau thanh lý */
  PENDING_SETTLEMENT: 'Chờ quyết toán nợ',
  ENDED: 'Đã kết thúc',
  TERMINATED: 'Đã kết thúc',
  CANCELLED: 'Đã huỷ',
  EXPIRED: 'Hết hạn',
};

export function contractStatusLabelVi(status: string | null | undefined): string {
  if (status == null || status === '') return '—';
  const key = String(status).toUpperCase();
  return CONTRACT_STATUS_LABELS_VI[key] ?? String(status);
}
