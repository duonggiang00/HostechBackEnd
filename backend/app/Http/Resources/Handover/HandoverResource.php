<?php

namespace App\Http\Resources\Handover;

use App\Http\Resources\Finance\RefundReceiptResource;
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
        $latestRefund = $this->resource->getAttribute('latest_refund_receipt');

        return [
            'id' => $this->id,
            'org_id' => $this->org_id,
            'contract_id' => $this->contract_id,
            'room_id' => $this->room_id,
            'created_by_user_id' => $this->created_by_user_id,
            'note' => $this->note,
            'document_scan_urls' => $this->getMedia('document_scans')->map->getUrl(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'org' => $this->whenLoaded('org'),
            'contract' => $this->whenLoaded('contract'),
            'room' => $this->whenLoaded('room'),
            'createdBy' => $this->whenLoaded('createdBy'),
            'items' => HandoverItemResource::collection($this->whenLoaded('items')),
            'meter_snapshots' => HandoverMeterSnapshotResource::collection($this->whenLoaded('meterSnapshots')),
            'refund_receipt' => $latestRefund ? new RefundReceiptResource($latestRefund) : null,
        ];
    }
}
