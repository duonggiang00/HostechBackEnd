<?php

namespace App\Enums;

enum PenaltyRuleCalcMode: string
{
    case FIXED = 'FIXED';
    case PERCENT_RENT = 'PERCENT_RENT';
    case PERCENT_DEPOSIT = 'PERCENT_DEPOSIT';
    case PER_DAY = 'PER_DAY';

    public function label(): string
    {
        return match ($this) {
            self::FIXED => 'Số tiền cố định',
            self::PERCENT_RENT => 'Phần trăm của tiền thuê tháng',
            self::PERCENT_DEPOSIT => 'Phần trăm của tiền đặt cọc',
            self::PER_DAY => 'Số tiền mỗi ngày trễ',
        };
    }
}
