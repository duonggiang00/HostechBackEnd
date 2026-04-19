<?php

namespace App\Http\Resources\Contract;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractStatusHistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'contract_id'  => $this->contract_id,
            'old_status'   => $this->old_status,
            'new_status'   => $this->new_status,
            'reason'       => $this->reason,
            'comment'      => $this->comment,
            'created_at'   => $this->created_at?->toIso8601String(),
            'changedBy'    => [
                'id'        => $this->changedBy?->id,
                'full_name' => $this->changedBy?->full_name,
                'email'     => $this->changedBy?->email,
            ],
        ];
    }
}
