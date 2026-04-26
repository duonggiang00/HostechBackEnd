<?php

namespace App\Events\Property;

use App\Models\Property\Floor;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FloorDeleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Floor $floor)
    {
    }
}
