<?php

namespace App\Http\Resources\Handover;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HandoverItemResource extends JsonResource
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
            'room_asset_id' => $this->room_asset_id,
            'name' => $this->name,
            'status' => $this->status,
            'note' => $this->note,
            'sort_order' => $this->sort_order,
            'condition_photo_urls' => $this->getMedia('condition_photos')->map->getUrl(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
