<?php

namespace App\Enums;

enum DepositStatus: string
{
    case PENDING = 'PENDING';
    case HELD = 'HELD';
    case REFUNDED = 'REFUNDED';
    case PARTIAL_REFUND = 'PARTIAL_REFUND';
    case FORFEITED = 'FORFEITED';
}
