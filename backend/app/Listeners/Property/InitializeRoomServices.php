<?php

namespace App\Listeners\Property;

use App\Events\Property\RoomCreated;
use App\Events\Property\RoomUpdated;
use App\Models\Meter\Meter;
use App\Models\Property\RoomPrice;
use App\Models\Property\RoomFloorPlanNode;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class InitializeRoomServices implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(RoomCreated|RoomUpdated $event): void
    {
        $room = $event->room;
        $performerId = $event->performerId;

        try {
            if ($event instanceof RoomCreated) {
                $this->initializeNewRoom($room, $performerId);
            }

            if ($event instanceof RoomUpdated) {
                $this->handleRoomUpdate($event);
            }
        } catch (\Exception $e) {
            // In EDA, we don't want initialization failures to crash the event pipe
            Log::error("InitializeRoomServices failed for Room {$room->id}: " . $e->getMessage());
        }
    }

    /**
     * Logic for brand new rooms.
     */
    protected function initializeNewRoom($room, $performerId): void
    {
        // 1. Inherit default services from property
        $property = $room->property;
        if ($property && $room->services()->count() === 0) {
            $defaultServices = $property->defaultServices()->pluck('services.id');
            foreach ($defaultServices as $serviceId) {
                $room->services()->syncWithoutDetaching([$serviceId => [
                    'org_id' => $room->org_id,
                    'quantity' => 1,
                ]]);
            }
        }

        // 2. Always initialize Electricity and Water meters
        $this->ensureDefaultMeters($room);

        // 3. Initialize FloorPlanNode (Auto position on grid)
        $this->ensureFloorPlanNode($room);

        // 4. Initial Price History (if base_price > 0)
        if ($room->base_price > 0) {
            RoomPrice::updateOrCreate(
                ['room_id' => $room->id, 'price' => $room->base_price],
                [
                    'org_id' => $room->org_id,
                    'effective_from' => now()->toDateString(),
                    'created_by_user_id' => $performerId,
                ]
            );
        }

        // 5. Initial Status History
        $room->statusHistories()->updateOrCreate(
            ['room_id' => $room->id, 'to_status' => $room->status, 'from_status' => null],
            [
                'org_id' => $room->org_id,
                'reason' => 'Initial creation',
                'changed_by_user_id' => $performerId,
            ]
        );
    }

    /**
     * Logic for updated rooms (e.g. status/price changes).
     */
    protected function handleRoomUpdate(RoomUpdated $event): void
    {
        $room = $event->room;
        $changes = $event->changes ?? [];
        $performerId = $event->performerId;

        // 1. Status Change History
        if (isset($changes['status'])) {
            $fromStatus = $room->getOriginal('status');
            $toStatus = $changes['status'];
            
            if ($fromStatus !== $toStatus) {
                $room->statusHistories()->create([
                    'org_id' => $room->org_id,
                    'from_status' => $fromStatus,
                    'to_status' => $toStatus,
                    'reason' => 'Status updated',
                    'changed_by_user_id' => $performerId,
                ]);
            }
            
            // If moved from draft to available, ensure resources exist
            if ($toStatus === 'available') {
                $this->ensureDefaultMeters($room);
                $this->ensureFloorPlanNode($room);
            }
        }

        // 2. Price Change History
        if (isset($changes['base_price']) && $changes['base_price'] > 0) {
             RoomPrice::create([
                'org_id' => $room->org_id,
                'room_id' => $room->id,
                'effective_from' => now()->toDateString(),
                'price' => $changes['base_price'],
                'created_by_user_id' => $performerId,
            ]);
        }
    }

    /**
     * Create 'ELECTRIC' and 'WATER' meters if they don't exist.
     */
    protected function ensureDefaultMeters($room): void
    {
        $types = ['ELECTRIC', 'WATER'];
        foreach ($types as $type) {
            $suffix = ($type === 'ELECTRIC') ? 'E' : 'W';
            $propertySuffix = $room->property_id ? '-' . substr($room->property_id, 0, 4) : '';
            
            Meter::updateOrCreate(
                ['room_id' => $room->id, 'type' => $type],
                [
                    'org_id' => $room->org_id,
                    'property_id' => $room->property_id,
                    'code' => "{$room->code}-{$suffix}{$propertySuffix}",
                    'base_reading' => 0,
                    'is_active' => true,
                ]
            );
        }
    }

    /**
     * Initialize RoomFloorPlanNode with automatic grid positioning.
     */
    protected function ensureFloorPlanNode($room): void
    {
        if (!$room->floor_id) {
            return;
        }

        if (RoomFloorPlanNode::where('room_id', $room->id)->exists()) {
            return;
        }

        // Find largest column index in this floor to place new room at the end
        $maxColumn = RoomFloorPlanNode::where('floor_id', $room->floor_id)->max('x');
        $nextColumn = $maxColumn !== null ? (int) ceil((float) $maxColumn) + 1 : 0;

        try {
            RoomFloorPlanNode::create([
                'org_id'   => $room->org_id,
                'floor_id' => $room->floor_id,
                'room_id'  => $room->id,
                'x'        => $nextColumn,
                'y'        => 0,
                'width'    => 1,
                'height'   => 1,
            ]);
        } catch (\Exception $e) {
            // Already exists or unique collision, safe to ignore in auto-init
        }
    }
}
