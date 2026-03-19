<?php

namespace App\Http\Resources\Meter;

use App\Http\Resources\Property\RoomResource;
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
        // Get property from room relationship or direct property_id
        $property = $this->room?->property;
        
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'property_id' => $this->property_id,
            'property_name' => $property?->name ?? $this->property?->name,
            'room_id' => $this->room_id,
            'room_name' => $this->room?->name,
            'base_reading' => $this->base_reading,
            'installed_at' => $this->installed_at ? $this->installed_at->format('Y-m-d') : null,
            'is_active' => (bool) $this->is_active,
            'is_master' => (bool) $this->is_master,
            'meta' => $this->meta,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
            'room' => new RoomResource($this->whenLoaded('room')),
        ];
    }
}
