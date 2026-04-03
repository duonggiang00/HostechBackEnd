<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserInvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'token' => $this->token,
            'role_name' => $this->role_name,
            'org_id' => $this->org_id,
            'properties_scope' => $this->properties_scope,
            'invited_by' => $this->invited_by,
            'expires_at' => $this->expires_at,
            'registered_at' => $this->registered_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relationships
            'org' => $this->whenLoaded('org'),
            'inviter' => $this->whenLoaded('inviter'),
        ];
    }
}
