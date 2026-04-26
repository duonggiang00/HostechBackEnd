<?php

namespace App\Events\Billing;

use Carbon\Carbon;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BillingBatchCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string  $propertyId,
        public Carbon  $periodMonth,
        public int     $total,
        public int     $success,
        public int     $failed,
        public array   $errors = []
    ) {}
}
