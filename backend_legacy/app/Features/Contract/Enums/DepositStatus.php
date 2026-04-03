<?php

namespace App\Features\Contract\Enums;

enum DepositStatus: string
{
    case PENDING = 'PENDING';
    case PAID = 'PAID';
    case REFUNDED = 'REFUNDED';
    case FORFEITED = 'FORFEITED';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Chờ đóng',
            self::PAID => 'Đã đóng',
            self::REFUNDED => 'Đã hoàn trả',
            self::FORFEITED => 'Đã khấu trừ',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'warning',
            self::PAID => 'success',
            self::REFUNDED => 'info',
            self::FORFEITED => 'error',
        };
    }
}
