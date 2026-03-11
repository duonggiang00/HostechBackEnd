<?php

namespace App\Http\Resources\Meter;

use App\Http\Resources\Org\UserResource;
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
            'meter_reading_id' => $this->meter_reading_id,
            'reason' => $this->reason,
            'before_value' => $this->before_value,
            'after_value' => $this->after_value,
            'status' => $this->status,
            'requested_by' => new UserResource($this->whenLoaded('requestedBy')),
            'approved_by' => new UserResource($this->whenLoaded('approvedBy')),
            'approved_at' => $this->approved_at,
            'rejected_by' => new UserResource($this->whenLoaded('rejectedBy')),
            'rejected_at' => $this->rejected_at,
            'reject_reason' => $this->reject_reason,
            'created_at' => $this->created_at,
            'proofs' => $this->whenLoaded('media', function () {
                // Return media items associated with the 'adjustment_proofs' collection
                return $this->getMedia('adjustment_proofs')->map(function ($media) {
                    return [
                        'id' => $this->id,
                        'url' => $media->getUrl(),
                        'name' => $media->name,
                        'file_name' => $media->file_name,
                        'mime_type' => $media->mime_type,
                        'size' => $media->size,
                    ];
                });
            }),
        ];
    }
}
