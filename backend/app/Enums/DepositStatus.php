<?php

namespace App\Enums;

enum DepositStatus: string
{
    case UNPAID = 'UNPAID';
    case HELD = 'HELD';
    case REFUND_PENDING = 'REFUND_PENDING';
    case REFUNDED = 'REFUNDED';
    case PARTIAL_REFUND = 'PARTIAL_REFUND';
    case FORFEITED = 'FORFEITED';

    /**
     * Danh sách tất cả values (dùng cho validation).
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::UNPAID => 'Chưa đóng',
            self::HELD => 'Đang giữ',
            self::REFUNDED => 'Đã hoàn trả',
            self::PARTIAL_REFUND => 'Hoàn trả 1 phần',
            self::FORFEITED => 'Bị phạt (mất cọc)',
        };
    }
}
