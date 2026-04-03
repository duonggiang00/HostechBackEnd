<?php

namespace App\Features\Property\Resources;

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
            'area' => $this->area ? (float) $this->area : null,
            'shared_area' => $this->shared_area ? (float) $this->shared_area : null,
            'note' => $this->note,
            'use_floors' => (bool) $this->use_floors,
            'default_billing_cycle' => $this->default_billing_cycle,
            'default_due_day' => $this->default_due_day,
            'default_cutoff_day' => $this->default_cutoff_day,
            'bank_accounts' => $this->bank_accounts,
            'default_rent_price_per_m2' => $this->default_rent_price_per_m2 ? (float) $this->default_rent_price_per_m2 : null,
            'default_deposit_months' => $this->default_deposit_months,
            'default_services' => $this->whenLoaded('defaultServices'),
            'floors_count' => $this->floors_count ?? $this->whenCounted('floors'),
            'rooms_count' => $this->rooms_count ?? $this->whenCounted('rooms'),
            'stats' => [
                'total_rooms' => (int) ($this->rooms_count ?? $this->rooms()->count()),
                'occupied_rooms' => (int) ($this->occupied_rooms_count ?? 0),
                'vacant_rooms' => (int) ($this->vacant_rooms_count ?? 0),
                'occupancy_rate' => ($this->rooms_count ?? 0) > 0 
                    ? round(($this->occupied_rooms_count / $this->rooms_count) * 100, 1) 
                    : 0,
            ],
            'floors' => FloorResource::collection($this->whenLoaded('floors')),
            'rooms' => RoomResource::collection($this->whenLoaded('rooms')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
