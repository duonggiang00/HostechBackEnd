<?php

namespace App\Http\Resources\Contract;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Property\PropertyResource;
use App\Http\Resources\Property\RoomResource;
use App\Http\Resources\Org\UserResource;

class ContractResource extends JsonResource
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
            'status' => $this->status,
            'property' => new PropertyResource($this->whenLoaded('property')),
            'room' => new RoomResource($this->whenLoaded('room')),
            'members' => ContractMemberResource::collection($this->whenLoaded('members')),
            'start_date' => $this->start_date ? $this->start_date->format('Y-m-d') : null,
            'end_date' => $this->end_date ? $this->end_date->format('Y-m-d') : null,
            'rent_price' => (float) $this->rent_price,
            'deposit_amount' => (float) $this->deposit_amount,
            'billing_cycle' => $this->billing_cycle,
            'due_day' => $this->due_day,
            'cutoff_day' => $this->cutoff_day,
            'join_code' => $this->join_code,
            'join_code_expires_at' => $this->join_code_expires_at ? $this->join_code_expires_at->toIso8601String() : null,
            'created_by' => new UserResource($this->whenLoaded('createdBy')),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
