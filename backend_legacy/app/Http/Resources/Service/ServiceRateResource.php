<?php

namespace App\Http\Resources\Service;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceRateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_id' => $this->service_id,
            'price' => $this->price,
            'effective_from' => $this->effective_from->format('Y-m-d'),
            'created_by_user_id' => $this->created_by_user_id,
            'created_at' => $this->created_at,
        ];
    }
}
