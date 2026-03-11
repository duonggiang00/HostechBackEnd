<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'log_name' => $this->log_name,
            'description' => $this->description,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'causer_type' => $this->causer_type,
            'causer_id' => $this->causer_id,
            'properties' => $this->properties,
            'event' => $this->event,
            'org_id' => $this->org_id,
            'created_at' => $this->created_at,

            // Relationships
            'causer' => $this->whenLoaded('causer'),
            'subject' => $this->whenLoaded('subject'),
        ];
    }
}
