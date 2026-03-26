<?php

namespace App\Http\Resources\Property;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property string $id ID của tầng
 * @property string $property_id ID của tòa nhà
 * @property string $code Mã tầng
 * @property string $name Tên tầng
 * @property int $sort_order Thứ tự sắp xếp
 * @property array $rooms Danh sách phòng (nếu có)
 * @property string $created_at Thời gian tạo
 * @property string $updated_at Thời gian cập nhật
 */
class FloorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'code' => $this->code,
            'name' => $this->name,
            'floor_number' => $this->floor_number,
            'sort_order' => $this->sort_order,
            'rooms_count' => $this->rooms_count ?? ($this->relationLoaded('rooms') ? $this->rooms->count() : 0),
            'vacant_rooms_count' => $this->vacant_rooms_count ?? ($this->relationLoaded('rooms') ? $this->rooms->whereIn('status', ['available', 'vacant'])->count() : 0),
            'occupied_rooms_count' => $this->occupied_rooms_count ?? ($this->relationLoaded('rooms') ? $this->rooms->whereIn('status', ['occupied', 'rented'])->count() : 0),
            'rooms' => RoomResource::collection($this->whenLoaded('rooms')),
            'floor_plan_image' => $this->whenLoaded('media', function () {
                $media = $this->getFirstMedia('floor_plan');
                return $media ? $media->getUrl() : null;
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
