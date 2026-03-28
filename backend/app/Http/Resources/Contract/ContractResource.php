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
            'id' => $this->id,
            'org_id' => $this->org_id,
            'status' => $this->status,
            'property' => new PropertyResource($this->whenLoaded('property')),
            'room' => new RoomResource($this->whenLoaded('room')),
            'members' => ContractMemberResource::collection($this->whenLoaded('members')),
            'start_date' => $this->start_date ? $this->start_date->format('Y-m-d') : null,
            'end_date' => $this->end_date ? $this->end_date->format('Y-m-d') : null,
            'rent_price' => (float) $this->rent_price,
            'base_rent' => (float) $this->base_rent,
            'fixed_services_fee' => (float) $this->fixed_services_fee,
            'total_rent' => (float) $this->total_rent,
            'monthly_rent' => (float) $this->rent_price, // Alias for frontend
            'deposit_amount' => (float) $this->deposit_amount,
            'billing_cycle' => $this->billing_cycle,
            'billing_cycle_months' => $this->resolveBillingCycleMonths($this->billing_cycle),
            'cycle_months' => (int) $this->cycle_months,
            'due_day' => (int) $this->due_day,
            'cutoff_day' => (int) $this->cutoff_day,
            'tenant' => $this->whenLoaded('members', function () {
                $tenant = $this->members->first();
                return $tenant ? [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'email' => $tenant->email,
                ] : null;
            }),
            'meta' => $this->meta,
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
