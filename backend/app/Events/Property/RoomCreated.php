<?php

namespace App\Events\Property;

use App\Models\Property\Room;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  bool  $deferHeavyInitialization  True: đẩy meter/giá/lịch sử/dịch vụ mặc định sang queue (sync sơ đồ hàng loạt).
     */
    public function __construct(
        public Room $room,
        public ?array $changes = null,
        public ?string $performerId = null,
        public bool $deferHeavyInitialization = false,
    ) {}
}
