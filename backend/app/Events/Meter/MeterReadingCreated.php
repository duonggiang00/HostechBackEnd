<?php

namespace App\Events\Meter;

use App\Models\Meter\MeterReading;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeterReadingCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public MeterReading $reading
    ) {}
}
