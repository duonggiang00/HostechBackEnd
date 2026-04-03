<?php

namespace App\Features\Contract\Enums;

enum ContractStatus: string
{
    case DRAFT = 'DRAFT';
    case PENDING = 'PENDING';
    case ACTIVE = 'ACTIVE';
    case ENDED = 'ENDED';
    case TERMINATED = 'TERMINATED';
    case EXPIRED = 'EXPIRED';
    case CANCELLED = 'CANCELLED';
    case PENDING_SIGNATURE = 'PENDING_SIGNATURE';
    case PENDING_PAYMENT = 'PENDING_PAYMENT';
    
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function allowedForConfirmation(): array
    {
        return [self::PENDING_PAYMENT, self::PENDING_SIGNATURE];
    }

    public static function allowAcceptSignature(): array
    {
        return [self::PENDING_SIGNATURE];
    }

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Nháp',
            self::PENDING => 'Chờ duyệt',
            self::ACTIVE => 'Đang hiệu lực',
            self::ENDED => 'Đã kết thúc',
            self::TERMINATED => 'Đã thanh lý',
            self::EXPIRED => 'Đã hết hạn',
            self::CANCELLED => 'Đã hủy',
            self::PENDING_SIGNATURE => 'Chờ ký',
            self::PENDING_PAYMENT => 'Chờ thanh toán',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'info',
            self::PENDING => 'warning',
            self::ACTIVE => 'success',
            self::ENDED => 'primary',
            self::TERMINATED => 'error',
            self::EXPIRED => 'error',
            self::CANCELLED => 'error',
            self::PENDING_SIGNATURE => 'warning',
            self::PENDING_PAYMENT => 'warning',
        };
    }
}
