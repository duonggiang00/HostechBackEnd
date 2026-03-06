<?php

namespace App\Http\Resources\Ticket;

use App\Http\Resources\Org\UserResource;
use App\Http\Resources\Property\PropertyResource;
use App\Http\Resources\Property\RoomResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'org_id' => $this->org_id,
            'property_id' => $this->property_id,
            'room_id' => $this->room_id,
            'contract_id' => $this->contract_id,
            'created_by_user_id' => $this->created_by_user_id,
            'assigned_to_user_id' => $this->assigned_to_user_id,
            'category' => $this->category,
            'priority' => $this->priority,
            'status' => $this->status,
            'description' => $this->description,

            // Relationships (eager loaded)
            'property' => new PropertyResource($this->whenLoaded('property')),
            'room' => new RoomResource($this->whenLoaded('room')),
            'created_by' => new UserResource($this->whenLoaded('createdBy')),
            'assigned_to' => new UserResource($this->whenLoaded('assignedTo')),
            'events' => TicketEventResource::collection($this->whenLoaded('events')),
            'costs' => TicketCostResource::collection($this->whenLoaded('costs')),

            // Timestamps
            'due_at' => $this->due_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
