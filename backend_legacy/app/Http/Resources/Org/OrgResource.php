<?php

namespace App\Http\Resources\Org;

use Illuminate\Http\Resources\Json\JsonResource;

class OrgResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'timezone' => $this->timezone,
            'currency' => $this->currency,
            'properties_count' => $this->whenCounted('properties'),
            'users_count' => $this->whenCounted('users'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
