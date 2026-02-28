<?php

namespace App\Http\Resources\Handover;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HandoverMeterSnapshotResource extends JsonResource
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
            'handover_id' => $this->handover_id,
            'meter_id' => $this->meter_id,
            'reading_value' => $this->reading_value,
            'meter_photo_urls' => $this->getMedia('meter_photos')->map->getUrl(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'meter' => $this->whenLoaded('meter'),
        ];
    }
}
