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
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'event_type' => $this->event_type ?? 'STATUS_CHANGE',
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'notes' => $this->notes,
            'payload' => $this->payload,
            'created_at' => $this->created_at?->toIso8601String(),
            'changed_by_user' => $this->whenLoaded('changedBy', function () {
                if (! $this->changedBy) {
                    return null;
                }

                return [
                    'id' => $this->changedBy->id,
                    'full_name' => $this->changedBy->full_name,
                    'email' => $this->changedBy->email,
                ];
            }, fn () => $this->changedBy ? [
                'id' => $this->changedBy->id,
                'full_name' => $this->changedBy->full_name,
                'email' => $this->changedBy->email,
            ] : null),
        ];
    }
}
