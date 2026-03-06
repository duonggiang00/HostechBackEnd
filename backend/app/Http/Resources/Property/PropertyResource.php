<?php

namespace App\Http\Resources\Property;

use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'address' => $this->address,
            'note' => $this->note,
            'use_floors' => (bool) $this->use_floors,
            'default_billing_cycle' => $this->default_billing_cycle,
            'default_due_day' => $this->default_due_day,
            'default_cutoff_day' => $this->default_cutoff_day,
            'bank_accounts' => $this->bank_accounts,
            'floors' => FloorResource::collection($this->whenLoaded('floors')),
            'rooms' => RoomResource::collection($this->whenLoaded('rooms')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
