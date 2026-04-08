<?php

namespace App\Http\Resources\Property;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property string $id ID phòng
 * @property string $code Mã phòng
 * @property string $name Tên phòng
 * @property float $area Diện tích
 * @property int $capacity Sức chứa
 * @property float $base_price Giá cơ bản
 * @property string $status Trạng thái
 * @property int $floor_number Số tầng
 * @property string $description Mô tả

 * @property string $created_at Thời gian tạo
 * @property string $updated_at Thời gian cập nhật
 * @property-read \App\Models\Contract\Contract[] $contracts Danh sách hợp đồng
 * @property-read \App\Models\Meter\Meter[] $meters Danh sách đồng hồ
 * @property-read \App\Models\Invoice\Invoice[] $invoices Danh sách hóa đơn
 */
class RoomResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'floor_id' => $this->floor_id,
            'code' => $this->code,
            'name' => $this->name,
            'area' => $this->area,
            'capacity' => $this->capacity,
            'base_price' => $this->base_price,
            'status' => $this->status,
            'floor_number' => $this->floor_number,
            'description' => $this->description,

            'is_draft' => $this->status === 'draft',
            'floor_name' => $this->floor_name ?? $this->floor?->name,
            'property_name' => $this->property_name ?? $this->property?->name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relations
            // 'floor' => FloorResource::make($this->whenLoaded('floor')),
            // 'property' => PropertyResource::make($this->whenLoaded('property')),

            // Relations (optimized for single-call detail view)
            'assets' => $this->whenLoaded('assets', function () {
                return $this->assets->map(fn($asset) => [
                    'id' => $asset->id,
                    'name' => $asset->name,
                    'serial' => $asset->serial,
                    'condition' => $asset->condition,
                ]);
            }),
            'price_histories' => $this->whenLoaded('prices', function () {
                return collect($this->prices)->sortByDesc('effective_from')->take(10)->values()->map(fn($price) => [
                    'price' => (float) $price->price,
                    'start_date' => $price->effective_from?->format('Y-m-d'),
                    'end_date' => null,
                ]);
            }),
            'status_histories' => $this->whenLoaded('statusHistories', function () {
                return collect($this->statusHistories)->sortByDesc('created_at')->take(10)->values()->map(fn($history) => [
                    'id' => $history->id,
                    'from_status' => $history->from_status,
                    'to_status' => $history->to_status,
                    'notes' => $history->reason,
                    'actor_name' => $history->changedByUser?->full_name,
                    'created_at' => $history->created_at?->toIso8601String(),
                ]);
            }),
            'floor_plan_node' => $this->whenLoaded('floorPlanNode', function () {
                return $this->floorPlanNode ? [
                    'x' => $this->floorPlanNode->x,
                    'y' => $this->floorPlanNode->y,
                    'width' => $this->floorPlanNode->width,
                    'height' => $this->floorPlanNode->height,
                ] : null;
            }),

            'contracts' => $this->whenLoaded('contracts', function () {
                return collect($this->contracts)->sortByDesc('start_date')->take(5)->values()->map(fn($contract) => [
                    'id' => $contract->id,
                    'start_date' => $contract->start_date instanceof \Carbon\Carbon ? $contract->start_date->format('Y-m-d') : ($contract->start_date ? \Carbon\Carbon::parse($contract->start_date)->format('Y-m-d') : null),
                    'end_date' => $contract->end_date instanceof \Carbon\Carbon ? $contract->end_date->format('Y-m-d') : ($contract->end_date ? \Carbon\Carbon::parse($contract->end_date)->format('Y-m-d') : null),
                    'status' => strtolower($contract->status instanceof \App\Enums\ContractStatus ? $contract->status->value : $contract->status),
                    'monthly_rent' => (float) $contract->rent_price,
                    'deposit_amount' => (float) $contract->deposit_amount,
                    'members' => $contract->members->map(fn($m) => [
                        'id' => $m->id,
                        'user_id' => $m->user_id,
                        'full_name' => $m->user?->full_name,
                        'role' => $m->role,
                        'status' => $m->status,
                        'is_primary' => $m->role === 'TENANT',
                    ]),
                ]);
            }),

            'active_contract' => $this->when($this->activeContract, function () {
                $contract = $this->activeContract;
                return [
                    'id' => $contract->id,
                    'status' => strtolower($contract->status instanceof \App\Enums\ContractStatus ? $contract->status->value : $contract->status),
                    'start_date' => $contract->start_date instanceof \Carbon\Carbon ? $contract->start_date->format('Y-m-d') : ($contract->start_date ? \Carbon\Carbon::parse($contract->start_date)->format('Y-m-d') : null),
                    'monthly_rent' => (float) $contract->rent_price,
                    'deposit_amount' => (float) $contract->deposit_amount,
                    'members' => $contract->members->map(fn($m) => [
                        'full_name' => $m->user?->full_name,
                        'role' => $m->role,
                        'status' => $m->status,
                    ]),
                ];
            }),

            'meters' => \App\Http\Resources\Meter\MeterResource::collection($this->whenLoaded('meters')),

            'invoices' => $this->whenLoaded('invoices', function () {
                return collect($this->invoices)->sortByDesc('period_start')->take(10)->values()->map(fn($invoice) => [
                    'id' => $invoice->id,
                    'issue_date' => $invoice->created_at instanceof \Carbon\Carbon ? $invoice->created_at->format('Y-m-d') : ($invoice->created_at ? \Carbon\Carbon::parse($invoice->created_at)->format('Y-m-d') : null),
                    'period_start' => $invoice->period_start instanceof \Carbon\Carbon ? $invoice->period_start->format('Y-m-d') : ($invoice->period_start ? \Carbon\Carbon::parse($invoice->period_start)->format('Y-m-d') : null),
                    'period_end' => $invoice->period_end instanceof \Carbon\Carbon ? $invoice->period_end->format('Y-m-d') : ($invoice->period_end ? \Carbon\Carbon::parse($invoice->period_end)->format('Y-m-d') : null),
                    'status' => strtolower($invoice->status),
                    'total_amount' => (float) $invoice->total_amount,
                    'paid_amount' => (float) $invoice->paid_amount,
                ]);
            }),

            'room_services' => $this->whenLoaded('roomServices', function () {
                return $this->roomServices->map(fn($rs) => [
                    'id' => $rs->id,
                    'quantity' => (int) ($rs->quantity ?? 1),
                    'service' => [
                        'id' => $rs->service_id ?? $rs->service?->id,
                        'name' => $rs->service?->name,
                        'price' => (float) ($rs->service?->current_price ?? 0),
                        'unit' => $rs->service?->unit,
                        'calc_mode' => $rs->service?->calc_mode,
                    ],
                ]);
            }),

            // Media (Spatie MediaLibrary) - Optimized mapping
            'images' => $this->whenLoaded('media', function () {
                return $this->getMedia('gallery')->map(function ($media) {
                    return [
                        'id' => $media->uuid,
                        'url' => $media->getUrl(),
                        'thumb' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : $media->getUrl(),
                    ];
                });
            }),
        ];
    }
}
