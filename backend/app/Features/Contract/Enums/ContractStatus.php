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
    
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
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
        };
    }
}
