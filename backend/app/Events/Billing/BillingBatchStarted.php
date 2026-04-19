<?php

namespace App\Events\Billing;

use Carbon\Carbon;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BillingBatchStarted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string  $propertyId,
        public Carbon  $periodMonth,
        public int     $totalContracts,
        public ?string $triggeredByUserId = null
    ) {}
}
