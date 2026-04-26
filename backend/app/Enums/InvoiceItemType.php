<?php

namespace App\Enums;

enum InvoiceItemType: string
{
    case RENT = 'RENT';
    case SERVICE = 'SERVICE';
    case PENALTY = 'PENALTY';
    case DISCOUNT = 'DISCOUNT';
    case ADJUSTMENT = 'ADJUSTMENT';
    case DEBT = 'DEBT';
    case DEPOSIT = 'DEPOSIT';

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
            self::RENT => 'Tiền phòng',
            self::SERVICE => 'Dịch vụ',
            self::PENALTY => 'Phạt',
            self::DISCOUNT => 'Giảm giá',
            self::ADJUSTMENT => 'Điều chỉnh',
            self::DEBT => 'Nợ tồn đọng',
            self::DEPOSIT => 'Tiền đặt cọc',
        };
    }
}
