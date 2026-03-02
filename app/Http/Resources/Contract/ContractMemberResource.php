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
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'identity_number' => $this->identity_number,
            'role' => $this->role,
            'status' => $this->status,
            'is_primary' => $this->is_primary,
            'joined_at' => $this->joined_at ? $this->joined_at->toIso8601String() : null,
            'left_at' => $this->left_at ? $this->left_at->toIso8601String() : null,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
