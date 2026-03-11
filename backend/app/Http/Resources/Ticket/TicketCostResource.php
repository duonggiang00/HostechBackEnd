<?php

namespace App\Http\Resources\Ticket;

use App\Http\Resources\Org\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketCostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => (float) $this->amount,
            'payer' => $this->payer,
            'note' => $this->note,
            'created_by' => new UserResource($this->whenLoaded('createdBy')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
