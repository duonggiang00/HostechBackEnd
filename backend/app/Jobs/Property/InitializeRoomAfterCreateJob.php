<?php

namespace App\Jobs\Property;

use App\Listeners\Property\InitializeRoomServices;
use App\Models\Property\Room;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Khởi tạo meter / giá / lịch sử trạng thái / dịch vụ mặc định sau khi tạo phòng.
 * Dùng khi sync sơ đồ mặt bằng tạo nhiều phòng — tránh chạy nặng N lần trong một request (khi queue ≠ sync).
 */
class InitializeRoomAfterCreateJob implements ShouldQueueAfterCommit
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public function __construct(
        public string $roomId,
        public ?string $performerId,
    ) {}

    public function handle(InitializeRoomServices $initializer): void
    {
        $room = Room::find($this->roomId);
        if (! $room) {
            return;
        }

        try {
            $initializer->initializeNewRoom($room, $this->performerId);
        } catch (\Exception $e) {
            Log::error("InitializeRoomAfterCreateJob failed for Room {$this->roomId}: ".$e->getMessage());
            throw $e;
        }
    }
}
