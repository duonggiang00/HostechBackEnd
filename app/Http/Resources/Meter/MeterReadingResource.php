<?php

namespace App\Http\Resources\Meter;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeterReadingResource extends JsonResource
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
            'meter_id' => $this->meter_id,
            'period_start' => $this->period_start?->format('Y-m-d'),
            'period_end' => $this->period_end?->format('Y-m-d'),
            'reading_value' => $this->reading_value,
            'status' => $this->status,
            'submitted_by_user_id' => $this->submitted_by_user_id,
            'submitted_at' => $this->submitted_at?->format('Y-m-d H:i:s'),
            'approved_by_user_id' => $this->approved_by_user_id,
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'locked_at' => $this->locked_at?->format('Y-m-d H:i:s'),
            'meta' => $this->meta,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),

            'meter' => new MeterResource($this->whenLoaded('meter')),
            'submitted_by' => $this->whenLoaded('submittedBy'),
            'approved_by' => $this->whenLoaded('approvedBy'),
        ];
    }
}
