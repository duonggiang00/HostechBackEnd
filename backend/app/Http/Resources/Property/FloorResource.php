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
            'sort_order' => $this->sort_order,
            'rooms' => RoomResource::collection($this->whenLoaded('rooms')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
