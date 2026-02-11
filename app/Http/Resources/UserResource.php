<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'org_id' => $this->org_id,
            'role' => $this->role,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'phone_verified_at' => $this->phone_verified_at,
            'is_active' => $this->is_active,
            'mfa_enabled' => $this->mfa_enabled,
            'last_login_at' => $this->last_login_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
