<?php

namespace App\Http\Resources\Contract;

use App\Http\Resources\Org\UserResource;
use App\Http\Resources\Property\PropertyResource;
use App\Http\Resources\Property\RoomResource;
use App\Models\Invoice\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'org_id'               => $this->org_id,
            'property_id'          => $this->property_id,
            'room_id'              => $this->room_id,
            'status'               => $this->status,
            'base_rent'            => (float) $this->base_rent,
            'fixed_services_fee'   => (float) $this->fixed_services_fee,
            'total_rent'           => (float) $this->total_rent,
            'cycle_months'         => (int) $this->cycle_months,
            'start_date'           => $this->start_date?->toDateString(),
            'end_date'             => $this->end_date?->toDateString(),
            'billing_cycle'        => $this->billing_cycle,
            'billing_cycle_months' => $this->resolveBillingCycleMonths($this->billing_cycle),
            'due_day'              => (int) $this->due_day,
            'cutoff_day'           => (int) $this->cutoff_day,
            'rent_price'           => (float) $this->rent_price,
            'monthly_rent'         => (float) $this->rent_price,
            'deposit_amount'       => (float) $this->deposit_amount,
            'deposit_status'       => $this->deposit_status,
            'refunded_amount'      => (float) $this->refunded_amount,
            'forfeited_amount'     => (float) $this->forfeited_amount,
            'join_code'            => $this->when(! $request->user()?->hasRole('Tenant'), $this->join_code),
            'join_code_expires_at' => $this->when(! $request->user()?->hasRole('Tenant'), $this->join_code_expires_at?->toIso8601String()),
            'signed_at'            => $this->signed_at?->toIso8601String(),
            // ── Termination ────────────────────────────────────────────────────────
            'terminated_at'        => $this->terminated_at?->toIso8601String(),
            'cancellation_party'   => $this->cancellation_party,
            'cancellation_reason'  => $this->cancellation_reason,
            'cancelled_at'         => $this->cancelled_at?->toIso8601String(),
            'notice_days'          => $this->notice_days,
            'notice_given_at'      => $this->notice_given_at?->toDateString(),

            'meta'                 => (object) $this->meta,
            'document_url'         => $this->document_path ? \Storage::url($this->document_path) : null,
            'signed_document_url'  => $this->getFirstMediaUrl('signed_contracts') ?: null,
            'created_at'           => $this->created_at->toIso8601String(),
            'updated_at'           => $this->updated_at->toIso8601String(),

            // Relations
            'room'                 => new RoomResource($this->whenLoaded('room')),
            'property'             => new PropertyResource($this->whenLoaded('property')),
            'members'              => ContractMemberResource::collection($this->whenLoaded('members')),
            'createdBy'            => new UserResource($this->whenLoaded('createdBy')),
            'statusHistories'      => \App\Http\Resources\Contract\ContractStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'tenant' => $this->whenLoaded('members', function () {
                $tenant = $this->members->first();
                return $tenant ? [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'email' => $tenant->email,
                ] : null;
            }),
            'initial_invoice' => $this->whenLoaded('invoices', function () {
                /** @var Invoice|null $invoice */
                $invoice = $this->invoices
                    ->first(fn ($inv) => is_array($inv->snapshot) && (($inv->snapshot['is_initial'] ?? false) === true));

                if (! $invoice) {
                    return null;
                }

                return [
                    'id' => $invoice->id,
                    'status' => $invoice->status,
                    'total_amount' => (float) $invoice->total_amount,
                    'paid_amount' => (float) $invoice->paid_amount,
                    'due_date' => $invoice->due_date?->format('Y-m-d'),
                ];
            }),
            'join_code' => $this->when(! $request->user()?->hasRole('Tenant'), $this->join_code),
            'join_code_expires_at' => $this->when(! $request->user()?->hasRole('Tenant'), $this->join_code_expires_at ? $this->join_code_expires_at->toIso8601String() : null),
            'document_path' => $this->document_path,
            'document_type' => $this->document_type,
            'scan_original_filename' => $this->scan_original_filename,
            'document_url' => $this->document_path ? route('api.contracts.document.download', $this->id) : null,
            'signed_document_url' => $this->getFirstMediaUrl('signed_contracts') ?: null,
            'created_by' => new UserResource($this->whenLoaded('createdBy')),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }

    private function resolveBillingCycleMonths(string|int|null $billingCycle): int
    {
        return match ((string) $billingCycle) {
            'MONTHLY' => 1,
            'QUARTERLY' => 3,
            'SEMI_ANNUALLY' => 6,
            'YEARLY' => 12,
            default => max(1, (int) $billingCycle),
        };
    }
}
