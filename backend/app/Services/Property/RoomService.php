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
            ->allowedIncludes(['floor', 'property', 'assets', 'prices', 'statusHistories', 'media', 'floorPlanNode'])
            ->defaultSort('code');

        // Scoping Pattern: Membership-based for Tenant
        if ($performer && $performer->hasRole('Tenant')) {
            $query->whereHas('contracts', function ($q) use ($performer) {
                $q->where('status', 'ACTIVE')
                    ->whereHas('members', function ($sq) use ($performer) {
                        $sq->where('user_id', $performer->id);
                        //  ->where('status', 'APPROVED'); // Removed status check because ContractMember table doesn't have a status column in this schema
                    });
            });
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

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?User $performer = null): LengthAwarePaginator
    {
        $query = QueryBuilder::for(Room::onlyTrashed())
            ->allowedFilters($allowedFilters)
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
            unset($data['assets'], $data['media_ids']);

            // Auto-assign org_id from property
            $data['org_id'] = $property->org_id;

            $room = Room::create($data);

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

            // Sync Price History (bỏ qua nếu là draft)
            if (isset($data['base_price']) && ($data['status'] ?? null) !== 'draft') {
                RoomPrice::create([
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'effective_from' => now()->toDateString(),
                    'price' => $data['base_price'],
                    'created_by_user_id' => $performer->id,
                ]);
            }

            // Sync Status History (bỏ qua nếu là draft)
            if (isset($data['status']) && $data['status'] !== 'draft') {
                RoomStatusHistory::create([
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'from_status' => null,
                    'to_status' => $data['status'],
                    'reason' => 'Initial creation',
                    'changed_by_user_id' => $performer->id,
                ]);
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

            // Track old status & price for history
            $oldStatus = $room->status;
            $oldPrice = $room->base_price;

            unset($data['assets'], $data['media_ids']);

            $room->update($data);

            // Sync Media
            if (! empty($mediaIds)) {
                $room->syncMediaAttachments($mediaIds, 'gallery');
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

            // Sync Price History
            if (isset($data['base_price']) && (float) $data['base_price'] !== (float) $oldPrice) {
                RoomPrice::updateOrCreate(
                    [
                        'room_id' => $room->id,
                        'effective_from' => now()->toDateString(),
                    ],
                    [
                        'org_id' => $room->org_id,
                        'price' => $data['base_price'],
                        'created_by_user_id' => $performer->id,
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
                    'changed_by_user_id' => $performer->id,
                ]);
            }

            return $room;
        });
    }

    public function delete(string $id): bool
    {
        $room = $this->find($id);

        return $room ? $room->delete() : false;
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
                $code = 'DRAFT-' . strtoupper(Str::random(6));
            } while (Room::where('property_id', $property->id)->where('code', $code)->exists());

            return Room::create([
                'org_id'      => $property->org_id,
                'property_id' => $property->id,
                'floor_id'    => $data['floor_id'] ?? null,
                'code'        => $code,
                'name'        => $data['name'],
                'status'      => 'draft',
                'base_price'  => 0,
            ]);
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

            $newPrice = $data['base_price'] ?? (float) $room->base_price;
            if ($newPrice <= 0) {
                abort(422, 'base_price must be greater than 0 to publish a room.');
            }

            $oldStatus = $room->status;
            $room->update(array_merge($data, ['status' => 'available']));

            // Ghi Price History
            RoomPrice::create([
                'org_id'             => $room->org_id,
                'room_id'            => $room->id,
                'effective_from'     => now()->toDateString(),
                'price'              => $room->base_price,
                'created_by_user_id' => $performer->id,
            ]);

            // Ghi Status History
            RoomStatusHistory::create([
                'org_id'              => $room->org_id,
                'room_id'             => $room->id,
                'from_status'         => $oldStatus,
                'to_status'           => 'available',
                'reason'              => 'Published',
                'changed_by_user_id'  => $performer->id,
            ]);

            return $room->fresh();
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

    public function removeFloorPlanNode(Room $room): bool
    {
        $node = RoomFloorPlanNode::where('room_id', $room->id)->first();

        return $node ? (bool) $node->delete() : false;
    }
}
