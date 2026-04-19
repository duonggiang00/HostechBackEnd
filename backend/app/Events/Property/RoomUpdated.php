<?php

namespace App\Events\Property;

use App\Models\Property\Room;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Room $room, public ?array $changes = null, public ?string $performerId = null)
    {
    }
}
