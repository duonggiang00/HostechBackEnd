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
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'installed_at' => $this->installed_at ? $this->installed_at->format('Y-m-d') : null,
            'is_active' => (bool) $this->is_active,
            'meta' => $this->meta,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'room' => new RoomResource($this->whenLoaded('room')),
        ];
    }
}
