<?php

namespace App\Http\Resources\Service;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
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
            'code' => $this->code,
            'name' => $this->name,
            'calc_mode' => $this->calc_mode,
            'unit' => $this->unit,
            'price' => $this->current_price, // Accessed via attribute accessor
            'is_recurring' => $this->is_recurring,
            'is_active' => $this->is_active,
            'meta' => $this->meta,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            
            // Optional: Include rates history if requested or if it's a detail view
            'rates' => ServiceRateResource::collection($this->whenLoaded('rates')),
        ];
    }
}
