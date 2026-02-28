<?php

namespace App\Services\Property;

use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class RoomAssetService
{
    /**
     * Get paginated list of assets for a specific room.
     *
     * @param string $roomId
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getAssetsByRoom(string $roomId, int $perPage = 15)
    {
        $room = Room::findOrFail($roomId);

        return QueryBuilder::for(RoomAsset::class)
            ->where('room_id', $room->id)
            ->allowedFilters([
                'name',
                'serial',
                'condition',
                AllowedFilter::exact('purchased_at'),
                AllowedFilter::exact('warranty_end'),
            ])
            ->allowedSorts(['name', 'purchased_at', 'warranty_end', 'created_at'])
            ->defaultSort('-created_at')
            ->paginate($perPage)
            ->appends(request()->query());
    }

    /**
     * Create a new asset for a room.
     *
     * @param string $roomId
     * @param array $data
     * @return RoomAsset
     */
    public function createAsset(string $roomId, array $data): RoomAsset
    {
        $room = Room::findOrFail($roomId);
        
        // Mặc dù MultiTenant có thể tự map org_id của User, nhưng để chắc chắn 
        // tài sản luôn thuộc về cùng một cty với cái Phòng thì ta map tay.
        $data['room_id'] = $room->id;
        $data['org_id'] = $room->org_id;

        return RoomAsset::create($data);
    }

    /**
     * Find a specific asset.
     *
     * @param string $assetId
     * @return RoomAsset
     */
    public function getAssetById(string $assetId): RoomAsset
    {
        return RoomAsset::findOrFail($assetId);
    }

    /**
     * Update an asset.
     *
     * @param string $assetId
     * @param array $data
     * @return RoomAsset
     */
    public function updateAsset(string $assetId, array $data): RoomAsset
    {
        $asset = RoomAsset::findOrFail($assetId);
        $asset->update($data);
        return $asset;
    }

    /**
     * Delete an asset.
     *
     * @param string $assetId
     * @return bool
     */
    public function deleteAsset(string $assetId): bool
    {
        $asset = RoomAsset::findOrFail($assetId);
        return $asset->delete();
    }
}
