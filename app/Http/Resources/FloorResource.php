<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class FloorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'code' => $this->code,
            'name' => $this->name,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
