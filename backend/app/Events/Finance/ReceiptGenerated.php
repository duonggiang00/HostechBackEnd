<?php

namespace App\Events\Finance;

use App\Models\Finance\Receipt;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dispatched after a receipt PDF is successfully generated and stored.
 * This triggers follow-up actions like sending emails with attachments.
 */
class ReceiptGenerated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Receipt $receipt
    ) {}
}
