/**
 * Single source of truth for Quick Invoice meter readiness (điện/nước đã duyệt + có tiêu thụ kỳ ghi nhận).
 */

export type RoomMeterReadinessDetail = {
  room_services?: Array<{
    service?: { calc_mode?: string; type?: string; name?: string };
  }>;
  meters?: Array<{
    type?: string;
    is_active?: boolean;
    last_read_at?: string | null;
    /** Tiêu thụ theo lần đọc đã duyệt gần nhất (API MeterResource). */
    consumption?: number;
  }>;
};

const meterTypeLabel = (type: string): string => {
  if (type === 'ELECTRIC') return 'ĐIỆN';
  if (type === 'WATER') return 'NƯỚC';
  return type;
};

/**
 * Các loại đồng hồ chưa đủ điều kiện lập hóa đơn nhanh (PER_METER theo room_services):
 * - chưa có đồng hồ gắn phòng,
 * - chưa có chỉ số đã duyệt (`last_read_at`),
 * - hoặc đã duyệt nhưng tiêu thụ kỳ đó = 0 (không có số để tính tiền theo chỉ số).
 */
export function getMissingApprovedMeterLabels(
  roomDetail: RoomMeterReadinessDetail | null | undefined,
): string[] {
  if (!roomDetail) return [];

  const meters = (roomDetail.meters || []) as Array<{
    type?: string;
    is_active?: boolean;
    last_read_at?: string | null;
    consumption?: number;
  }>;

  const requiredMeterTypes = (roomDetail.room_services || [])
    .filter((rs) => rs.service?.calc_mode === 'PER_METER')
    .map((rs) => rs.service?.type)
    .filter(Boolean) as string[];

  const missing: string[] = [];

  const pushLabel = (label: string) => {
    if (!missing.includes(label)) missing.push(label);
  };

  requiredMeterTypes.forEach((type: string) => {
    // Ưu tiên đồng hồ active. Chỉ cần CÓ ÍT NHẤT 1 đồng hồ cùng type đạt điều kiện
    // (đã duyệt và consumption > 0) là phòng đủ điều kiện cho type đó.
    const sameTypeMeters = meters.filter((m) => m.type === type);
    if (sameTypeMeters.length === 0) {
      pushLabel(meterTypeLabel(type));
      return;
    }

    const activeMeters = sameTypeMeters.filter((m) => m.is_active !== false);
    const candidateMeters = activeMeters.length > 0 ? activeMeters : sameTypeMeters;

    const hasQualifiedReading = candidateMeters.some((m) =>
      Boolean(m.last_read_at) && Number(m.consumption ?? 0) > 0
    );

    if (!hasQualifiedReading) {
      pushLabel(meterTypeLabel(type));
    }
  });

  return missing;
}

/**
 * Đủ điều kiện gửi / hiển thị form hóa đơn nhanh (đồng bộ với `getMissingApprovedMeterLabels`).
 */
export function isRoomReadyForQuickInvoiceSubmit(
  roomDetail: RoomMeterReadinessDetail | null | undefined,
): boolean {
  if (!roomDetail) return false;
  return getMissingApprovedMeterLabels(roomDetail).length === 0;
}
