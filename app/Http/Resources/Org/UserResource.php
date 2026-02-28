<?php

namespace App\Http\Resources\Org;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                    => (string) $this->id,
            'org_id'                => $this->org_id ? (string) $this->org_id : null,

            // Basic contact info
            'full_name'             => $this->full_name,
            'email'                 => $this->email,
            'phone'                 => $this->phone,

            // Identity / personal
            'identity_number'       => $this->identity_number,
            'identity_issued_date'  => $this->identity_issued_date,
            'identity_issued_place' => $this->identity_issued_place,
            'date_of_birth'         => $this->date_of_birth,
            'address'               => $this->address,

            // Avatar URL (via Spatie Media Library)
            'avatar_url'            => $this->getFirstMediaUrl('avatar') ?: null,

            // Account status
            'is_active'             => $this->is_active,
            'email_verified_at'     => $this->email_verified_at,
            'phone_verified_at'     => $this->phone_verified_at,
            'last_login_at'         => $this->last_login_at,

            // MFA / OTP
            'mfa_enabled'           => $this->mfa_enabled,
            'mfa_method'            => $this->mfa_method,
            'two_factor_enabled'    => !is_null($this->two_factor_confirmed_at),

            // RBAC
            'roles'                 => $this->roles->pluck('name'),
            'permissions'           => $this->getAllPermissions()->pluck('name'),

            'created_at'            => $this->created_at,
            'updated_at'            => $this->updated_at,
        ];
    }
}
