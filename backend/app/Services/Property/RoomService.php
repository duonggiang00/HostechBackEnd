<?php

namespace App\Services\Property;

use App\Models\Org\User;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomFloorPlanNode;
use App\Models\Property\RoomPrice;
use App\Models\Property\RoomStatusHistory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Property\RoomTemplate;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\QueryBuilder;

class RoomService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?User $performer = null): LengthAwarePaginator
    {
        $allowedFilters = array_merge($allowedFilters, [
            \Spatie\QueryBuilder\AllowedFilter::exact('property_id'),
            \Spatie\QueryBuilder\AllowedFilter::exact('floor_id'),
        ]);

        $query = QueryBuilder::for(Room::class)
            ->with(['floor', 'property'])
            ->allowedFilters($allowedFilters)
            ->allowedSorts(['name', 'code', 'status', 'type', 'area', 'capacity', 'created_at', 'floor_number', 'base_price'])
            ->allowedIncludes(['floor', 'property', 'assets', 'prices', 'statusHistories', 'media', 'floorPlanNode', 'contracts', 'contracts.members', 'meters', 'meters.readings', 'meters.latestReading', 'meters.latestApprovedReading', 'invoices', 'roomServices'])
            ->defaultSort('code');

        // Scoping Pattern: Membership-based for Tenant (Renters) OR they can see 'available' rooms
            if ($performer && $performer->hasRole('Tenant')) {
                $myPropertyIds = \App\Models\Contract\Contract::query()
                    ->whereIn('status', ['ACTIVE', 'PENDING_PAYMENT'])
                    ->whereHas('members', function ($q) use ($performer) {
                        $q->where('user_id', $performer->id);
                    })
                    ->pluck('property_id')
                    ->unique()
                    ->toArray();

                $query->whereIn('property_id', $myPropertyIds);
            } elseif ($performer && $performer->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('property.managers', function ($q) use ($performer) {
                $q->where('user_id', $performer->id);
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->distinct()->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?User $performer = null): LengthAwarePaginator
    {
        $allowedFilters = array_merge($allowedFilters, [
            \Spatie\QueryBuilder\AllowedFilter::exact('property_id'),
            \Spatie\QueryBuilder\AllowedFilter::exact('floor_id'),
        ]);

        $query = QueryBuilder::for(Room::onlyTrashed())
            ->with(['floor', 'property'])
            ->allowedFilters($allowedFilters)
            ->allowedSorts(['name', 'code', 'status', 'type', 'area', 'capacity', 'created_at', 'floor_number', 'base_price', 'deleted_at'])
            ->allowedIncludes(['floor', 'property', 'assets', 'prices', 'statusHistories', 'media', 'floorPlanNode', 'contracts', 'contracts.members', 'meters', 'meters.readings', 'meters.latestReading', 'meters.latestApprovedReading', 'invoices', 'roomServices'])
            ->defaultSort('code');

        if ($performer && $performer->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('property.managers', function ($q) use ($performer) {
                $q->where('user_id', $performer->id);
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->distinct()->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Room
    {
        return Room::find($id);
    }

    public function findTrashed(string $id): ?Room
    {
        return Room::onlyTrashed()->find($id);
    }

    public function findWithTrashed(string $id): ?Room
    {
        return Room::withTrashed()->find($id);
    }

    public function create(array $data, User $performer): Room
    {
        return DB::transaction(function () use ($data, $performer) {
            // Consolidated Property Check & Org Auto-assignment
            $property = \App\Models\Property\Property::findOrFail($data['property_id']);

            // Security: Check if Property belongs to User's Org (if not Admin)
            if (! $performer->hasRole('Admin') && $performer->org_id && (string) $property->org_id !== (string) $performer->org_id) {
                abort(403, 'Unauthorized: You cannot add rooms to a property in another organization.');
            }

            $assetsData = $data['assets'] ?? [];
            $mediaIds = $data['media_ids'] ?? [];
            $serviceIds = $data['service_ids'] ?? [];
            $metersData = $data['meters'] ?? [];
            unset($data['assets'], $data['media_ids'], $data['service_ids'], $data['meters']);

            // Auto-assign org_id from property
            $data['org_id'] = $property->org_id;

            // Area validation
            if (isset($data['area']) && $data['area'] > 0) {
                $this->validateRoomArea($property, $data['floor_id'] ?? null, (float) $data['area']);
            }



            $room = Room::create($data);

            // --- SYNC SERVICES (Before Event Dispatch) ---
            if (! empty($serviceIds)) {
                $syncData = [];
                foreach ($serviceIds as $sid) {
                    $syncData[$sid] = ['org_id' => $room->org_id];
                }
                $room->services()->sync($syncData);
            }

            // Sync Media
            if (! empty($mediaIds)) {
                $room->syncMediaAttachments($mediaIds, 'gallery');
            }

            // Sync Assets
            if (! empty($assetsData)) {
                $assetsToInsert = array_map(function ($asset) use ($room) {
                    return array_merge($asset, [
                        'id' => Str::uuid()->toString(),
                        'org_id' => $room->org_id,
                        'room_id' => $room->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }, $assetsData);
                RoomAsset::insert($assetsToInsert);
            }

            // --- DECOUPLED: EVENT DISPATCH ---
            // Side effects (Meters, Price History, Status History) are now handled in Listeners
            \App\Events\Property\RoomCreated::dispatch($room, null, $performer->id);
            // ---------------------------------

            return $room;

            return $room;
        });
    }

    public function createFromTemplate(string $templateId, array $overrides, User $performer): Room
    {
        return DB::transaction(function () use ($templateId, $overrides, $performer) {
            $template = RoomTemplate::with(['services', 'assets'])->findOrFail($templateId);

            $roomData = array_merge([
                'area'        => $template->area,
                'capacity'    => $template->capacity,
                'base_price'  => $template->base_price,
                'description' => $template->description,
                'property_id' => $template->property_id,
                'status'      => 'available',
            ], $overrides);

            // Inherit services if not explicitly provided
            if (! isset($overrides['service_ids']) && $template->services->isNotEmpty()) {
                $roomData['service_ids'] = $template->services->pluck('id')->toArray();
            }

            $room = $this->create($roomData, $performer);

            // Assets: create from template if not provided in overrides
            if (! isset($overrides['assets']) && $template->assets->isNotEmpty()) {
                foreach ($template->assets as $tAsset) {
                    $room->assets()->create([
                        'id'      => Str::uuid()->toString(),
                        'org_id'  => $room->org_id,
                        'room_id' => $room->id,
                        'name'    => $tAsset->name,
                    ]);
                }
            }

            // Media: copy gallery images from template to new room
            $templateMedia = $template->getMedia('gallery');
            foreach ($templateMedia as $media) {
                $media->copy($room, 'gallery');
            }

            return $room;
        });
    }

    public function update(string $id, array $data, User $performer): ?Room
    {
        return DB::transaction(function () use ($id, $data, $performer) {
            $room = $this->find($id);
            if (! $room) {
                return null;
            }

            $assetsData = $data['assets'] ?? null;
            $mediaIds = $data['media_ids'] ?? [];
            $serviceIds = $data['service_ids'] ?? null;

            // Track old status & price for history
            $oldStatus = $room->status;
            $oldPrice = $room->base_price;

            unset($data['assets'], $data['media_ids'], $data['service_ids']);

            // Area validation
            $newArea = isset($data['area']) ? (float) $data['area'] : (float) $room->area;
            if ($newArea > 0 && $newArea != (float) $room->area) {
                $this->validateRoomArea($room->property, $room->floor_id, $newArea, $room->id);
            }

            $room->update($data);

            // Sync Media
            if (! empty($mediaIds)) {
                $room->syncMediaAttachments($mediaIds, 'gallery');
            }

            // Sync Services
            if (is_array($serviceIds)) {
                $existingPivot = \App\Models\Service\RoomService::where('room_id', $room->id)->get();
                $existingServiceIds = $existingPivot->pluck('service_id')->toArray();

                $toAdd = array_diff($serviceIds, $existingServiceIds);
                $toRemove = array_diff($existingServiceIds, $serviceIds);

                if (!empty($toRemove)) {
                    \App\Models\Service\RoomService::where('room_id', $room->id)
                        ->whereIn('service_id', $toRemove)
                        ->delete();
                }

                foreach ($toAdd as $svcId) {
                    \App\Models\Service\RoomService::create([
                        'room_id' => $room->id,
                        'service_id' => $svcId,
                        'org_id' => $room->org_id,
                    ]);
                }
            }

            // Sync Assets
            if (is_array($assetsData)) {
                $existingAssetIds = $room->assets()->pluck('id')->toArray();
                $updatedAssetIds = [];

                foreach ($assetsData as $assetData) {
                    if (isset($assetData['id']) && in_array($assetData['id'], $existingAssetIds)) {
                        $asset = RoomAsset::find($assetData['id']);
                        if ($asset) {
                            $asset->update($assetData);
                            $updatedAssetIds[] = $asset->id;
                        }
                    } else {
                        $newAsset = RoomAsset::create(array_merge($assetData, [
                            'id' => Str::uuid()->toString(),
                            'org_id' => $room->org_id,
                            'room_id' => $room->id,
                        ]));
                        $updatedAssetIds[] = $newAsset->id;
                    }
                }

                $assetsToDelete = array_diff($existingAssetIds, $updatedAssetIds);
                if (! empty($assetsToDelete)) {
                    RoomAsset::whereIn('id', $assetsToDelete)->delete();
                }
            }

            // --- DECOUPLED: EVENT DISPATCH ---
            // Side effects like price/status history or cache clearing are handled in Listeners
            \App\Events\Property\RoomUpdated::dispatch($room, $room->getChanges(), $performer->id);
            // ---------------------------------

            return $room;
        });
    }

    public function delete(string $id): bool
    {
        $room = $this->find($id);
        if (! $room) {
            return false;
        }

        // Check if the room has active contracts
        $hasActiveContracts = $room->contracts()->whereIn('status', ['ACTIVE', 'PENDING'])->exists();
        if ($hasActiveContracts) {
            throw ValidationException::withMessages([
                'room' => 'Phòng này đang có hợp đồng hoạt động hoặc chờ xử lý. Vui lòng thanh lý hợp đồng trước khi xóa.',
            ]);
        }

        $deleted = $room->delete();
        
        if ($deleted) {
            \App\Events\Property\RoomDeleted::dispatch($room);
        }

        return $deleted;
    }

    public function deleteBatch(array $ids): array
    {
        $deleted = 0;
        $failed = [];

        foreach ($ids as $id) {
            $room = $this->find($id);
            if ($room) {
                // Check if the room has active contracts
                $hasActiveContracts = $room->contracts()->whereIn('status', ['ACTIVE', 'PENDING'])->exists();
                if ($hasActiveContracts) {
                    $failed[] = ['id' => $id, 'reason' => 'Room has active contracts.'];
                    continue;
                }

                if ($room->delete()) {
                    $deleted++;
                } else {
                    $failed[] = ['id' => $id, 'reason' => 'Delete failed.'];
                }
            } else {
                $failed[] = ['id' => $id, 'reason' => 'Not found.'];
            }
        }

        return ['deleted' => $deleted, 'failed' => $failed];
    }

    public function restore(string $id): bool
    {
        $room = $this->findTrashed($id);

        return $room ? $room->restore() : false;
    }

    public function forceDelete(string $id): bool
    {
        $room = $this->findWithTrashed($id);

        return $room ? $room->forceDelete() : false;
    }

    public function restoreBatch(array $ids): array
    {
        $restored = 0;
        $failed = [];

        foreach ($ids as $id) {
            $room = $this->findTrashed($id);
            if ($room && $room->restore()) {
                $restored++;
            } else {
                $failed[] = ['id' => $id, 'reason' => 'Restore failed or room not found in trash.'];
            }
        }

        return ['restored' => $restored, 'failed' => $failed];
    }

    public function forceDeleteBatch(array $ids): array
    {
        $deleted = 0;
        $failed = [];

        foreach ($ids as $id) {
            $room = $this->findWithTrashed($id);
            if ($room && $room->forceDelete()) {
                $deleted++;
            } else {
                $failed[] = ['id' => $id, 'reason' => 'Force delete failed or room not found.'];
            }
        }

        return ['deleted' => $deleted, 'failed' => $failed];
    }

    // ─── Quick Create (Draft) ────────────────────────────────────────────

    public function quickCreate(array $data, User $performer): Room
    {
        return DB::transaction(function () use ($data, $performer) {
            $property = \App\Models\Property\Property::findOrFail($data['property_id']);

            if (! $performer->hasRole('Admin') && $performer->org_id && (string) $property->org_id !== (string) $performer->org_id) {
                abort(403, 'Unauthorized: You cannot add rooms to a property in another organization.');
            }

            // Tự sinh code unique trong property
            do {
                $code = 'DRAFT-'.strtoupper(Str::random(6));
            } while (Room::where('property_id', $property->id)->where('code', $code)->exists());

            return Room::create([
                'org_id' => $property->org_id,
                'property_id' => $property->id,
                'floor_id' => $data['floor_id'] ?? null,
                'code' => $code,
                'name' => $data['name'],
                'status' => 'draft',
                'base_price' => 0,
            ]);
        });
    }

    public function quickCreateBatch(array $data, User $performer): \Illuminate\Support\Collection
    {
        return DB::transaction(function () use ($data, $performer) {
            $property = \App\Models\Property\Property::findOrFail($data['property_id']);
            $count = $data['count'] ?? 1;
            $prefix = $data['prefix'] ?? 'Room';
            $startNumber = $data['start_number'] ?? 1;

            if (! $performer->hasRole('Admin') && $performer->org_id && (string) $property->org_id !== (string) $performer->org_id) {
                abort(403, 'Unauthorized: You cannot add rooms to a property in another organization.');
            }

            $rooms = collect();
            $template = null;
            if (isset($data['template_id'])) {
                $template = RoomTemplate::with(['services', 'assets'])->find($data['template_id']);
            }

            for ($i = 0; $i < $count; $i++) {
                $number = $startNumber + $i;
                $name = "{$prefix} {$number}";

                // Build data based on template if available
                $roomData = [
                    'org_id' => $property->org_id,
                    'property_id' => $property->id,
                    'floor_id' => $data['floor_id'] ?? null,
                    'name' => $name,
                    'status' => 'draft',
                    'base_price' => 0,
                ];

                if ($template) {
                    $roomData = array_merge($roomData, [
                        'area' => $template->area,
                        'capacity' => $template->capacity,
                        'base_price' => $template->base_price,
                        'description' => $template->description,
                        'status' => 'available', // Templates usually imply ready-to-use
                    ]);
                }

                // Tự sinh code unique trong property
                do {
                    if ($template) {
                        $code = strtoupper(Str::slug($name));
                        if (Room::where('property_id', $property->id)->where('code', $code)->exists()) {
                            $code .= '-'.strtoupper(Str::random(4));
                        }
                    } else {
                        $code = 'DRAFT-'.strtoupper(Str::random(6));
                    }
                } while (Room::where('property_id', $property->id)->where('code', $code)->exists());

                $roomData['code'] = $code;

                // Sync Services from template to data
                if ($template && $template->services->isNotEmpty()) {
                    $roomData['service_ids'] = $template->services->pluck('id')->toArray();
                }

                $room = $this->create($roomData, $performer);

                if ($template) {
                    // Create Assets
                    foreach ($template->assets as $tAsset) {
                        $room->assets()->create([
                            'id'     => Str::uuid()->toString(),
                            'org_id' => $room->org_id,
                            'name'   => $tAsset->name,
                        ]);
                    }

                    // Copy gallery images from template to new room
                    $templateMedia = $template->getMedia('gallery');
                    foreach ($templateMedia as $media) {
                        $media->copy($room, 'gallery');
                    }
                }

                $rooms->push($room);
            }

            return $rooms;
        });
    }

    // ─── Publish ──────────────────────────────────────────────────────────

    public function publish(Room $room, ?array $overrides, User $performer): Room
    {
        return DB::transaction(function () use ($room, $overrides, $performer) {
            if (! $room->isDraft()) {
                abort(422, 'Room is already published.');
            }

            $data = array_filter($overrides ?? [], fn ($v) => ! is_null($v));

            // Nếu override code, kiểm tra unique
            if (! empty($data['code']) && $data['code'] !== $room->code) {
                $exists = Room::where('property_id', $room->property_id)
                    ->where('code', $data['code'])
                    ->where('id', '!=', $room->id)
                    ->exists();
                if ($exists) {
                    abort(422, 'Room code already exists in this property.');
                }
            }

            $room->update(array_merge($data, ['status' => 'available']));


            // --- DECOUPLED: EVENT DISPATCH ---
            \App\Events\Property\RoomUpdated::dispatch($room, $room->getChanges(), $performer->id);
            // ---------------------------------

            return $room;
        });
    }

    // ─── Floor Plan Node ─────────────────────────────────────────────────

    public function setFloorPlanNode(Room $room, array $data, User $performer): RoomFloorPlanNode
    {
        return RoomFloorPlanNode::updateOrCreate(
            ['room_id' => $room->id],
            array_merge($data, [
                'org_id' => $room->org_id,
            ])
        );
    }

    public function batchSetFloorPlanNodes(array $nodesData, User $performer): array
    {
        return DB::transaction(function () use ($nodesData, $performer) {
            $results = [];
            foreach ($nodesData as $data) {
                $room = $this->find($data['room_id']);
                if ($room) {
                    $node = RoomFloorPlanNode::updateOrCreate(
                        ['room_id' => $room->id],
                        array_merge($data, [
                            'org_id' => $room->org_id,
                        ])
                    );
                    $results[] = $node;
                }
            }
            return $results;
        });
    }

    public function removeFloorPlanNode(Room $room): bool
    {
        $node = RoomFloorPlanNode::where('room_id', $room->id)->first();

        return $node ? (bool) $node->delete() : false;
    }

    /**
     * Validate that the room's area does not exceed limits.
     */
    protected function validateRoomArea(\App\Models\Property\Property $property, ?string $floorId, float $newArea, ?string $excludeRoomId = null): void
    {
        // Rule 1: Room Area <= Property Area (If property area is defined)
        if ($property->area > 0 && $newArea > (float) $property->area) {
            throw ValidationException::withMessages([
                'area' => 'Diện tích phòng ('.$newArea.' m²) không được lớn hơn tổng diện tích tòa nhà ('.(float) $property->area.' m²).',
            ]);
        }

        if ($property->use_floors && $floorId) {
            $floor = \App\Models\Property\Floor::find($floorId);
            if ($floor && $floor->area > 0) {
                // Feature limits check for Floor
                if ($newArea > (float) $floor->area) {
                    throw ValidationException::withMessages([
                        'area' => 'Diện tích phòng ('.$newArea.' m²) không được lớn hơn diện tích tầng ('.(float) $floor->area.' m²).',
                    ]);
                }

                // Sum Check for Floor
                $currentRoomsArea = Room::where('floor_id', $floorId)
                    ->when($excludeRoomId, fn ($q) => $q->where('id', '!=', $excludeRoomId))
                    ->sum('area');

                $totalUsedArea = $currentRoomsArea + $newArea + (float) $floor->shared_area;

                if ($totalUsedArea > (float) $floor->area) {
                    throw ValidationException::withMessages([
                        'area' => 'Tổng diện tích các phòng và diện tích dùng chung ('.$totalUsedArea.' m²) vượt quá diện tích thiết kế của tầng ('.(float) $floor->area.' m²).',
                    ]);
                }
            }
        } elseif (! $property->use_floors && $property->area > 0) {
            // Sum Check for Property
            $currentRoomsArea = Room::where('property_id', $property->id)
                ->when($excludeRoomId, fn ($q) => $q->where('id', '!=', $excludeRoomId))
                ->sum('area');

            $totalUsedArea = $currentRoomsArea + $newArea + (float) $property->shared_area;

            if ($totalUsedArea > (float) $property->area) {
                throw ValidationException::withMessages([
                    'area' => 'Tổng diện tích các phòng và diện tích dùng chung ('.$totalUsedArea.' m²) vượt quá diện tích thiết kế của tòa nhà ('.(float) $property->area.' m²).',
                ]);
            }
        }
    }

    /**
     * Get availability status of a room based on current active contracts.
     */
    public function getAvailabilityStatus(string $roomId): array
    {
        return app(\App\Services\Contract\ContractService::class)->getRoomAvailabilityStatus($roomId);
    }
}
