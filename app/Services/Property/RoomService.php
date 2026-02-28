<?php

namespace App\Services\Property;

use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomPrice;
use App\Models\Property\RoomStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\QueryBuilder;

class RoomService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Room::class)
            ->allowedFilters($allowedFilters)
            ->allowedIncludes(['assets', 'prices', 'statusHistories', 'media'])
            ->defaultSort('code');

        $user = request()->user();
        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('contracts', function ($q) use ($user) {
                $q->where('status', 'ACTIVE')
                  ->whereHas('members', function ($sq) use ($user) {
                      $sq->where('user_id', $user->id)
                         ->where('status', 'APPROVED');
                  });
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($propertyId = request()->input('property_id')) {
            $query->where('property_id', $propertyId);
        }

        if ($floorId = request()->input('floor_id')) {
            $query->where('floor_id', $floorId);
        }

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Room::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->defaultSort('code');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
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

    public function create(array $data): Room
    {
        return DB::transaction(function () use ($data) {
            $assetsData = $data['assets'] ?? [];
            $mediaIds = $data['media_ids'] ?? [];
            unset($data['assets'], $data['media_ids']);

            $room = Room::create($data);

            // Sync Media
            if (!empty($mediaIds)) {
                $room->syncMediaAttachments($mediaIds, 'gallery');
            }

            // Sync Assets
            if (!empty($assetsData)) {
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

            // Sync Price History
            if (isset($data['base_price'])) {
                RoomPrice::create([
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'effective_from' => now()->toDateString(),
                    'price' => $data['base_price'],
                    'created_by_user_id' => request()->user()?->id,
                ]);
            }

            // Sync Status History
            if (isset($data['status'])) {
                RoomStatusHistory::create([
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'from_status' => null,
                    'to_status' => $data['status'],
                    'reason' => 'Initial creation',
                    'changed_by_user_id' => request()->user()?->id,
                ]);
            }

            return $room;
        });
    }

    public function update(string $id, array $data): ?Room
    {
        return DB::transaction(function () use ($id, $data) {
            $room = $this->find($id);
            if (!$room) return null;

            $assetsData = $data['assets'] ?? null;
            $mediaIds = $data['media_ids'] ?? [];
            
            // Track old status & price for history
            $oldStatus = $room->status;
            $oldPrice = $room->base_price;
            
            unset($data['assets'], $data['media_ids']);

            $room->update($data);

            // Sync Media (append new)
            if (!empty($mediaIds)) {
                $room->syncMediaAttachments($mediaIds, 'gallery');
            }

            // Sync Assets
            if (is_array($assetsData)) {
                $existingAssetIds = $room->assets()->pluck('id')->toArray();
                $updatedAssetIds = [];

                foreach ($assetsData as $assetData) {
                    if (isset($assetData['id']) && in_array($assetData['id'], $existingAssetIds)) {
                        // Update existing
                        $asset = RoomAsset::find($assetData['id']);
                        if ($asset) {
                            $asset->update($assetData);
                            $updatedAssetIds[] = $asset->id;
                        }
                    } else {
                        // Create new
                        $newAsset = RoomAsset::create(array_merge($assetData, [
                            'id' => Str::uuid()->toString(),
                            'org_id' => $room->org_id,
                            'room_id' => $room->id,
                        ]));
                        $updatedAssetIds[] = $newAsset->id;
                    }
                }

                // Delete missing
                $assetsToDelete = array_diff($existingAssetIds, $updatedAssetIds);
                if (!empty($assetsToDelete)) {
                    RoomAsset::whereIn('id', $assetsToDelete)->delete();
                }
            }

            // Sync Price History
            if (isset($data['base_price']) && (float)$data['base_price'] !== (float)$oldPrice) {
                RoomPrice::updateOrCreate(
                    [
                        'room_id' => $room->id,
                        'effective_from' => now()->toDateString(),
                    ],
                    [
                        'org_id' => $room->org_id,
                        'price' => $data['base_price'],
                        'created_by_user_id' => request()->user()?->id,
                    ]
                );
            }

            // Sync Status History
            if (isset($data['status']) && $data['status'] !== $oldStatus) {
                RoomStatusHistory::create([
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'from_status' => $oldStatus,
                    'to_status' => $data['status'],
                    'reason' => 'Status updated',
                    'changed_by_user_id' => request()->user()?->id,
                ]);
            }

            return $room;
        });
    }

    public function delete(string $id): bool
    {
        $room = $this->find($id);
        if ($room) {
            return $room->delete();
        }

        return false;
    }

    public function restore(string $id): bool
    {
        $room = $this->findTrashed($id);
        if ($room) {
            return $room->restore();
        }

        return false;
    }

    public function forceDelete(string $id): bool
    {
        $room = $this->findWithTrashed($id);
        if ($room) {
            return $room->forceDelete();
        }

        return false;
    }
}
