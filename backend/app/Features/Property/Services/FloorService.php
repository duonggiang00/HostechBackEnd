<?php

namespace App\Features\Property\Services;

use App\Features\Org\Models\User;
use App\Features\Property\Models\Floor;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;
use App\Features\Property\Models\RoomFloorPlanNode;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class FloorService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $propertyId = null, bool $withTrashed = false, ?User $performer = null, bool $onlyTrashed = false): LengthAwarePaginator
    {
        $allowedFilters = array_merge($allowedFilters, [AllowedFilter::exact('property_id')]);

        $query = QueryBuilder::for(Floor::class)
            ->allowedFilters($allowedFilters)
            ->allowedSorts(['name', 'code', 'sort_order', 'created_at'])
            ->allowedIncludes(['property', 'rooms', 'rooms.floorPlanNode'])
            ->defaultSort('sort_order')
            ->withCount([
                'rooms',
                'rooms as vacant_rooms_count' => function ($query) {
                    $query->whereIn('status', ['available', 'vacant']);
                },
                'rooms as occupied_rooms_count' => function ($query) {
                    $query->whereIn('status', ['occupied', 'rented']);
                },
            ]);

        if ($performer && $performer->hasRole('Tenant')) {
            $query->where(function ($q) use ($performer) {
                // Floor belongs to a room they rent
                $q->whereHas('rooms.contracts', function ($sq) use ($performer) {
                    $sq->where('status', 'ACTIVE')
                        ->whereHas('members', function ($ssq) use ($performer) {
                            $ssq->where('user_id', $performer->id)
                                ->where('status', 'APPROVED');
                        });
                })->orWhereHas('rooms', function ($sq) {
                    // Or the floor has an available room
                    $sq->where('status', 'available');
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

        if ($propertyId) {
            $query->where('property_id', $propertyId);
        }

        if ($onlyTrashed) {
            $query->onlyTrashed();
        } elseif ($withTrashed) {
            $query->withTrashed();
        }

        return $query->distinct()->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?User $performer = null, ?string $propertyId = null): LengthAwarePaginator
    {
        return $this->paginate($allowedFilters, $perPage, $search, $propertyId, false, $performer, true);
    }

    public function find(string $id): ?Floor
    {
        return Floor::withCount('rooms')->with('media')->find($id);
    }

    public function findTrashed(string $id): ?Floor
    {
        return Floor::onlyTrashed()->find($id);
    }

    public function findWithTrashed(string $id): ?Floor
    {
        return Floor::withTrashed()->find($id);
    }

    public function create(array $data, User $user): Floor
    {
        $property = Property::find($data['property_id']) ?? abort(404, 'Property not found');

        // Security: Check if Property belongs to User's Org (if not Admin)
        if (! $user->hasRole('Admin') && $user->org_id && (string) $property->org_id !== (string) $user->org_id) {
            abort(403, 'Unauthorized: You cannot add floors to a property in another organization.');
        }

        // Auto-assign org_id from Property
        $data['org_id'] = $property->org_id;

        return Floor::create($data);
    }

    public function update(string $id, array $data): ?Floor
    {
        $floor = $this->find($id) ?? abort(404, 'Floor not found');
        $floor->update($data);

        return $floor;
    }

    public function delete(string $id): bool
    {
        $floor = $this->find($id) ?? abort(404, 'Floor not found');

        return $floor->delete();
    }

    public function restore(string $id): bool
    {
        $floor = $this->findTrashed($id) ?? abort(404, 'Floor not found in trash');

        return $floor->restore();
    }

    public function forceDelete(string $id): bool
    {
        $floor = $this->findWithTrashed($id) ?? abort(404, 'Floor not found');

        return $floor->forceDelete();
    }

    /**
     * Đồng bộ hóa (xóa/thêm/sửa) hàng loạt vị trí phòng trên bản vẽ mặt bằng
     *
     * @param string $id Floor ID
     * @param array $nodes Array of room floor plan nodes
     */
    public function syncFloorPlanNodes(string $id, array $nodes): void
    {
        $floor = $this->find($id) ?? abort(404, 'Floor not found');

        // Verify that all rooms in the request belong to the Org (Security check)
        $roomIds = array_column($nodes, 'room_id');
        $validRoomsCount = Room::whereIn('id', $roomIds)
            ->where('org_id', $floor->org_id)
            ->count();

        if ($validRoomsCount !== count(array_unique($roomIds))) {
            abort(400, 'One or more rooms are invalid or do not belong to this organization.');
        }

        // Use transaction to ensure data integrity
        \Illuminate\Support\Facades\DB::transaction(function () use ($floor, $nodes, $roomIds) {
            // Delete any existing nodes for rooms that are no longer in the payload OR are strictly associated passing by the floor
            // Note: If a room shifts to a different floor, we just overwrite its node.
            RoomFloorPlanNode::whereIn('room_id', function ($query) use ($floor) {
                // Find all rooms currently belonging to this floor
                $query->select('id')->from('rooms')->where('floor_id', $floor->id);
            })->whereNotIn('room_id', $roomIds)->delete();

            // Insert or Update new nodes
            foreach ($nodes as $nodeData) {
                RoomFloorPlanNode::updateOrCreate(
                    ['room_id' => $nodeData['room_id']],
                    [
                        'x' => $nodeData['x'],
                        'y' => $nodeData['y'],
                        'width' => $nodeData['width'],
                        'height' => $nodeData['height'],
                        'rotation' => $nodeData['rotation'] ?? 0,
                        'label' => $nodeData['label'] ?? null,
                    ]
                );
            }
        });
    }

    /**
     * Upload ảnh mặt bằng của tầng
     */
    public function uploadFloorPlanImage(string $id, \Illuminate\Http\UploadedFile $image): \Spatie\MediaLibrary\MediaCollections\Models\Media
    {
        $floor = $this->find($id) ?? abort(404, 'Floor not found');

        return $floor->addMedia($image)
            ->toMediaCollection('floor_plan');
    }
}
