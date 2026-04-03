<?php

namespace App\Features\Meter\Resources;

use App\Features\Property\Resources\PropertyResource;
use App\Features\Property\Resources\RoomResource;
use App\Features\Service\Resources\ServiceResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeterResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'org_id' => $this->org_id,
            'property_id' => $this->property_id,
            'room_id' => $this->room_id,
            'service_id' => $this->service_id,
            'code' => $this->code,
            'type' => $this->type,
            'base_reading' => (int) $this->base_reading,
            'is_master' => (bool) $this->is_master,
            'installed_at' => $this->installed_at?->format('Y-m-d'),
            'is_active' => (bool) $this->is_active,
            'meta' => $this->meta,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Relationships
            'property' => new PropertyResource($this->whenLoaded('property')),
            'room' => new RoomResource($this->whenLoaded('room')),
            'service' => new ServiceResource($this->whenLoaded('service')),
            'latest_reading' => new MeterReadingResource($this->whenLoaded('latestReading')),
            'latest_approved_reading' => new MeterReadingResource($this->whenLoaded('latestApprovedReading')),
            'readings' => MeterReadingResource::collection($this->whenLoaded('readings')),
        ];
    }
}
