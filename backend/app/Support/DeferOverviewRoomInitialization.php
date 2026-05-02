<?php

namespace App\Support;

use App\Listeners\Property\InitializeRoomServices;
use App\Models\Property\Room;

/**
 * Với queue sync + tạo nhiều phòng trên sơ đồ: gom khởi tạo nặng chạy sau khi gửi response (FPM có fastcgi_finish_request).
 */
final class DeferOverviewRoomInitialization
{
    /** @var list<array{0: string, 1: string|null}> */
    private static array $pending = [];

    private static bool $shutdownRegistered = false;

    public static function push(string $roomId, ?string $performerId): void
    {
        self::$pending[] = [$roomId, $performerId];

        if (self::$shutdownRegistered) {
            return;
        }

        self::$shutdownRegistered = true;

        register_shutdown_function(static function (): void {
            $pending = self::$pending;
            self::$pending = [];
            self::$shutdownRegistered = false;

            if ($pending === []) {
                return;
            }

            if (function_exists('fastcgi_finish_request')) {
                @fastcgi_finish_request();
            }

            $initializer = app(InitializeRoomServices::class);

            foreach ($pending as [$roomId, $performerId]) {
                $room = Room::find($roomId);
                if ($room) {
                    $initializer->initializeNewRoom($room, $performerId);
                }
            }
        });
    }
}
