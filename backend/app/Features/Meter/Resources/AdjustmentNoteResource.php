<?php

namespace App\Features\Meter\Resources;

use App\Features\Org\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdjustmentNoteResource extends JsonResource
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
            'meter_reading_id' => $this->meter_reading_id,
            'old_value' => $this->old_value,
            'new_value' => $this->new_value,
            'reason' => $this->reason,
            'status' => $this->status,
            'approved_by_user_id' => $this->approved_by_user_id,
            'approved_at' => $this->approved_at,
            'rejected_at' => $this->rejected_at,
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Media
            'attachments' => $this->getMedia('*')->map(fn($media) => [
                'id' => $media->id,
                'url' => $media->getUrl(),
                'name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
            ]),

            // Relationships
            'meterReading' => new MeterReadingResource($this->whenLoaded('meterReading')),
            'approvedBy' => new UserResource($this->whenLoaded('approvedBy')),
        ];
    }
}
