<?php

namespace App\Http\Resources\Meter;

use App\Http\Resources\Property\RoomResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeterResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get property from room relationship or direct property_id
        $property = $this->room?->property;

        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'property_id' => $this->property_id,
            'property_name' => $property?->name ?? $this->property?->name,
            'room_id' => $this->room_id,
            'room_name' => $this->room?->name,
            'base_reading' => $this->base_reading,
            'installed_at' => $this->installed_at ? $this->installed_at->format('Y-m-d') : null,
            'is_active' => (bool) $this->is_active,
            'is_master' => (bool) $this->is_master,
            'meta' => $this->meta,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
            // Quick Invoice must rely on latest APPROVED only (exclude LOCKED).
            'latest_reading_id' => $this->latestInvoiceEligibleReading?->id,
            'latest_reading' => $this->latestInvoiceEligibleReading?->reading_value ?? $this->base_reading,
            'last_read_at' => $this->latestInvoiceEligibleReading?->period_end ? $this->latestInvoiceEligibleReading->period_end->format('Y-m-d') : null,
            'consumption' => $this->latestInvoiceEligibleReading?->consumption ?? 0,
            'room' => new RoomResource($this->whenLoaded('room')),
            'latest_approved_reading' => $this->whenLoaded('latestApprovedReading', function () {
                $r = $this->latestApprovedReading;
                if (! $r) {
                    return null;
                }

                return [
                    'id' => $r->id,
                    'period_start' => $r->period_start ? $r->period_start->format('Y-m-d') : null,
                    'period_end' => $r->period_end ? $r->period_end->format('Y-m-d') : null,
                    'reading_value' => $r->reading_value,
                    'status' => $r->status ?? null,
                ];
            }),
            /** Bản ghi mới nhất theo period_end (mọi trạng thái) — UI dùng để tính kỳ chốt nhanh kế tiếp kể cả SUBMITTED */
            'latest_period_reading' => $this->whenLoaded('latestReading', function () {
                $r = $this->latestReading;
                if (! $r) {
                    return null;
                }

                return [
                    'id' => $r->id,
                    'period_start' => $r->period_start ? $r->period_start->format('Y-m-d') : null,
                    'period_end' => $r->period_end ? $r->period_end->format('Y-m-d') : null,
                    'reading_value' => $r->reading_value,
                    'status' => $r->status ?? null,
                ];
            }),
            'media' => $this->getMedia('meter_attachments')->map(fn ($media) => [
                'id' => $media->id,
                'url' => $media->getFullUrl(),
                'name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
            ]),
        ];
    }
}
