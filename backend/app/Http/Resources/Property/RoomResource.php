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
 * @property int $floor_number Số tầng
 * @property string $description Mô tả
 * @property array $amenities Tiện nghi
 * @property array $utilities Dịch vụ
 * @property string $created_at Thời gian tạo
 * @property string $updated_at Thời gian cập nhật
 * @property-read \App\Models\Contract\Contract[] $contracts Danh sách hợp đồng
 * @property-read \App\Models\Meter\Meter[] $meters Danh sách đồng hồ
 * @property-read \App\Models\Invoice\Invoice[] $invoices Danh sách hóa đơn
 */
class RoomResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'floor_id' => $this->floor_id,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type,
            'area' => $this->area,
            'capacity' => $this->capacity,
            'base_price' => $this->base_price,
            'status' => $this->status,
            'floor_number' => $this->floor_number,
            'description' => $this->description,
            'amenities' => $this->amenities,
            'utilities' => $this->utilities,
            'is_draft' => $this->status === 'draft',
            'floor_name' => $this->floor_name ?? $this->floor?->name,
            'property_name' => $this->property_name ?? $this->property?->name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relations
            // 'floor' => FloorResource::make($this->whenLoaded('floor')),
            // 'property' => PropertyResource::make($this->whenLoaded('property')),

            // Relations (eager loaded via QueryBuilder allowedIncludes or via direct load)
            'assets' => $this->whenLoaded('assets'),
            'price_histories' => $this->whenLoaded('prices'),
            'status_histories' => $this->whenLoaded('statusHistories'),
            'floor_plan_node' => $this->whenLoaded('floorPlanNode'),
            'contracts' => \App\Http\Resources\Contract\ContractResource::collection($this->whenLoaded('contracts')),
            'active_contract' => \App\Http\Resources\Contract\ContractResource::make($this->whenLoaded('activeContract')),
            'meters' => \App\Http\Resources\Meter\MeterResource::collection($this->whenLoaded('meters')),
            'electricity_reading' => $this->whenLoaded('meters', function() {
                return $this->meters->where('type', 'ELECTRIC')->first()?->latestReading?->reading_value ?? 0;
            }),
            'water_reading' => $this->whenLoaded('meters', function() {
                return $this->meters->where('type', 'WATER')->first()?->latestReading?->reading_value ?? 0;
            }),
            'invoices' => \App\Http\Resources\Invoice\InvoiceResource::collection($this->whenLoaded('invoices')),
            'room_services' => \App\Http\Resources\Service\RoomServiceResource::collection($this->whenLoaded('roomServices')),

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
