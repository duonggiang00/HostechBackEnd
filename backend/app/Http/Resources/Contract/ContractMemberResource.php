<?php

namespace App\Http\Resources\Contract;

use App\Http\Resources\Org\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractMemberResource extends JsonResource
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
            'contract_id' => $this->contract_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'email' => $this->email,
            'full_name' => $this->full_name,
            'phone' => $this->phone ?? $this->user?->phone,
            'identity_number' => $this->identity_number,
            'permanent_address' => $this->permanent_address,
            'license_plate' => $this->license_plate,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender,
            'nationality' => $this->nationality,
            'identity_front_url' => $this->getFirstMediaUrl('identity_front') ?: null,
            'identity_back_url' => $this->getFirstMediaUrl('identity_back') ?: null,
            'role' => $this->role,
            'status' => $this->status,
            'is_primary' => $this->is_primary,
            'joined_at' => $this->joined_at ? $this->joined_at->toIso8601String() : null,
            'signed_at' => $this->signed_at ? $this->signed_at->toIso8601String() : null,
            'left_at' => $this->left_at ? $this->left_at->toIso8601String() : null,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
