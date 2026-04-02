<?php

namespace App\Features\Ticket\Resources;

use App\Features\Org\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'message' => $this->message,
            'meta' => $this->meta,
            'actor' => new UserResource($this->whenLoaded('actor')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
