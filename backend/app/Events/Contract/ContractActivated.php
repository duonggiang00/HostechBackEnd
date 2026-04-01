<?php

namespace App\Events\Contract;

use App\Models\Contract\Contract;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContractActivated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Contract $contract)
    {
    }
}
