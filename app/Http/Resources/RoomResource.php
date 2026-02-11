<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

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
        ];
    }
}
