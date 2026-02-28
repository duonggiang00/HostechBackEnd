<?php

namespace App\Http\Resources\Property;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property string $id ID phòng
 * @property string $code Mã phòng
 * @property string $name Tên phòng
 * @property string $type Loại phòng
 * @property float $area Diện tích
 * @property int $capacity Sức chứa
 * @property float $base_price Giá cơ bản
 * @property string $status Trạng thái
 * @property string $description Mô tả
 * @property array $amenities Tiện nghi
 * @property array $utilities Dịch vụ
 * @property string $created_at Thời gian tạo
 * @property string $updated_at Thời gian cập nhật
 */
class RoomResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type,
            'area' => $this->area,
            'floor' => $this->floor,
            'capacity' => $this->capacity,
            'base_price' => $this->base_price,
            'status' => $this->status,
            'description' => $this->description,
            'amenities' => $this->amenities,
            'utilities' => $this->utilities,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Relations (eager loaded via QueryBuilder allowedIncludes or via direct load)
            'assets' => $this->whenLoaded('assets'),
            'price_histories' => $this->whenLoaded('prices'),
            'status_histories' => $this->whenLoaded('statusHistories'),
            
            // Media (Spatie MediaLibrary)
            'images' => $this->whenLoaded('media', function () {
                return $this->getMedia('gallery')->map(function ($media) {
                    return [
                        'id' => $media->uuid,
                        'url' => $media->getUrl(),
                        'thumb' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : $media->getUrl(),
                    ];
                });
            }),
        ];
    }
}
