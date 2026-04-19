<?php

namespace App\Enums;

enum PenaltyRuleType: string
{
    case LATE_PAYMENT = 'LATE_PAYMENT';
    case EARLY_TERMINATION = 'EARLY_TERMINATION';
    case DAMAGE = 'DAMAGE';
    case DEPOSIT_DEDUCTION = 'DEPOSIT_DEDUCTION';
    case OTHER = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::LATE_PAYMENT => 'Phạt trễ hạn thanh toán',
            self::EARLY_TERMINATION => 'Phạt phá vỡ hợp đồng sớm',
            self::DAMAGE => 'Bồi thường hư hại tài sản',
            self::DEPOSIT_DEDUCTION => 'Khấu trừ tiền cọc',
            self::OTHER => 'Loại phạt khác',
        };
    }
}
