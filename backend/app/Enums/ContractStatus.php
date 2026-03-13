<?php

namespace App\Enums;

enum ContractStatus: string
{
    case DRAFT = 'DRAFT';
    case PENDING_SIGNATURE = 'PENDING_SIGNATURE';
    case PENDING_PAYMENT = 'PENDING_PAYMENT';
    case ACTIVE = 'ACTIVE';
    case ENDED = 'ENDED';
    case CANCELLED = 'CANCELLED';

    /**
     * Các trạng thái cho phép Tenant xác nhận ký.
     */
    public static function allowAcceptSignature(): array
    {
        return [self::DRAFT, self::PENDING_SIGNATURE];
    }

    /**
     * Trạng thái cho phép Admin xác nhận thanh toán.
     */
    public static function allowConfirmPayment(): array
    {
        return [self::PENDING_PAYMENT];
    }

    /**
     * Trạng thái cho phép huỷ hợp đồng.
     */
    public static function allowCancel(): array
    {
        return [self::DRAFT, self::PENDING_SIGNATURE, self::PENDING_PAYMENT];
    }

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
            self::DRAFT => 'Bản nháp',
            self::PENDING_SIGNATURE => 'Chờ ký',
            self::PENDING_PAYMENT => 'Chờ thanh toán',
            self::ACTIVE => 'Đang hiệu lực',
            self::ENDED => 'Đã kết thúc',
            self::CANCELLED => 'Đã huỷ',
        };
    }
}
