<?php

namespace App\Http\Resources\Handover;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HandoverResource extends JsonResource
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
            'contract_id' => $this->contract_id,
            'room_id' => $this->room_id,
            'type' => $this->type,
            'status' => $this->status,
            'note' => $this->note,
            'confirmed_by_user_id' => $this->confirmed_by_user_id,
            'confirmed_at' => $this->confirmed_at,
            'locked_at' => $this->locked_at,
            'document_scan_urls' => $this->getMedia('document_scans')->map->getUrl(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            'org' => $this->whenLoaded('org'),
            'contract' => $this->whenLoaded('contract'),
            'room' => $this->whenLoaded('room'),
            'confirmedBy' => $this->whenLoaded('confirmedBy'),
            'items' => HandoverItemResource::collection($this->whenLoaded('items')),
            'meter_snapshots' => HandoverMeterSnapshotResource::collection($this->whenLoaded('meterSnapshots')),
        ];
    }
}
