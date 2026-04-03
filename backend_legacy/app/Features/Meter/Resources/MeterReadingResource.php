<?php

namespace App\Features\Meter\Resources;

use App\Features\Org\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeterReadingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'org_id' => $this->org_id,
            'meter_id' => $this->meter_id,
            'period_start' => $this->period_start?->format('Y-m-d'),
            'period_end' => $this->period_end?->format('Y-m-d'),
            'reading_value' => (int) $this->reading_value,
            'consumption' => (float) $this->consumption,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'meta' => $this->meta,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Workflow timestamps
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'locked_at' => $this->locked_at?->toIso8601String(),

            // Media proofs (Spatie Media Library)
            'proofs' => $this->getMedia('reading_proofs')->map(fn($media) => [
                'id' => $media->id,
                'url' => $media->getUrl(),
                'thumb_url' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : $media->getUrl(),
                'name' => $media->name,
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
            ]),

            // Relationships
            'meter' => new MeterResource($this->whenLoaded('meter')),
            'submitted_by' => new UserResource($this->whenLoaded('submittedBy')),
            'approved_by' => new UserResource($this->whenLoaded('approvedBy')),
            'rejected_by' => new UserResource($this->whenLoaded('rejectedBy')),
            'adjustments' => AdjustmentNoteResource::collection($this->whenLoaded('adjustmentNotes')),
        ];
    }
}
