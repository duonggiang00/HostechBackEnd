<?php

namespace App\Http\Resources\Contract;

use App\Enums\ContractStatus;
use App\Http\Resources\Org\UserResource;
use App\Http\Resources\Property\PropertyResource;
use App\Http\Resources\Property\RoomResource;
use App\Models\Invoice\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

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
            'property_id' => $this->property_id,
            'room_id' => $this->room_id,
            'status' => $this->status,
            'has_invoice_debt' => $this->resolveHasInvoiceDebt(),
            'base_rent' => (float) $this->base_rent,
            'fixed_services_fee' => (float) $this->fixed_services_fee,
            'total_rent' => (float) $this->total_rent,
            'cycle_months' => (int) $this->cycle_months,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'billing_cycle' => $this->billing_cycle,
            'billing_cycle_months' => $this->resolveBillingCycleMonths($this->billing_cycle),
            'due_day' => (int) $this->due_day,
            'cutoff_day' => (int) $this->cutoff_day,
            'rent_price' => (float) $this->rent_price,
            'monthly_rent' => (float) $this->rent_price,
            'deposit_amount' => (float) $this->deposit_amount,
            'deposit_months' => (int) $this->deposit_months,
            'deposit_status' => $this->deposit_status,
            'refunded_amount' => (float) $this->refunded_amount,
            'forfeited_amount' => (float) $this->forfeited_amount,
            'join_code' => $this->when(! $request->user()?->hasRole('Tenant'), $this->join_code),
            'join_code_expires_at' => $this->when(! $request->user()?->hasRole('Tenant'), $this->join_code_expires_at?->toIso8601String()),
            'signed_at' => $this->signed_at?->toIso8601String(),
            // ── Termination ────────────────────────────────────────────────────────
            'terminated_at' => $this->terminated_at?->toIso8601String(),
            'cancellation_party' => $this->cancellation_party,
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'notice_days' => $this->notice_days,
            'notice_given_at' => $this->notice_given_at?->toDateString(),
            'expected_move_out_date' => $this->expected_move_out_date?->toDateString(),

            'meta' => (object) $this->meta,
            'document_url' => $this->document_path ? \Storage::url($this->document_path) : null,
            'signed_document_url' => $this->getFirstMediaUrl('signed_contracts') ?: null,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Relations
            'room' => new RoomResource($this->whenLoaded('room')),
            'property' => new PropertyResource($this->whenLoaded('property')),
            'members' => ContractMemberResource::collection($this->whenLoaded('members')),
            'primaryMember' => new ContractMemberResource($this->whenLoaded('primaryMember')),
            'createdBy' => new UserResource($this->whenLoaded('createdBy')),
            'statusHistories' => ContractStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'tenant' => $this->whenLoaded('members', function () {
                $tenant = $this->members->firstWhere('role', 'PRIMARY')
                    ?? $this->members->firstWhere('is_primary', true)
                    ?? $this->members->first();

                if (! $tenant) {
                    return null;
                }

                $displayName = $tenant->full_name
                    ?: $tenant->user?->full_name
                    ?: $tenant->email;

                return [
                    'id' => $tenant->id,
                    'name' => $displayName,
                    'full_name' => $tenant->full_name,
                    'email' => $tenant->email,
                ];
            }),
            'initial_invoice' => $this->whenLoaded('invoices', function () {
                /** @var Invoice|null $invoice */
                $invoice = $this->invoices
                    ->first(fn ($inv) => is_array($inv->snapshot) && (($inv->snapshot['is_initial'] ?? false) === true));

                // Fallback for PENDING_PAYMENT contracts without the is_initial flag
                // (e.g. seeded data or contracts created before the flag was introduced).
                if (! $invoice && $this->status instanceof ContractStatus && $this->status === ContractStatus::PENDING_PAYMENT) {
                    $invoice = $this->invoices->sortBy('created_at')->first();
                }

                if (! $invoice) {
                    return null;
                }

                $debt = max(0, (float) $invoice->total_amount - (float) $invoice->paid_amount);

                return [
                    'id' => $invoice->id,
                    'code' => 'INV-'.strtoupper(substr(str_replace('-', '', (string) $invoice->id), 0, 8)),
                    'status' => $invoice->status,
                    'total_amount' => (float) $invoice->total_amount,
                    'paid_amount' => (float) $invoice->paid_amount,
                    'debt' => $debt,
                    'due_date' => $invoice->due_date?->format('Y-m-d'),
                ];
            }),
            'invoice_debt' => $this->whenLoaded('invoices', function () {
                $outstanding = $this->outstandingDebtInvoices();
                $now = now()->startOfDay();
                $total = $outstanding->sum(fn (Invoice $inv) => max(0, (float) $inv->total_amount - (float) $inv->paid_amount));
                $overdueCount = $outstanding->filter(function (Invoice $inv) use ($now) {
                    if (! $inv->due_date) {
                        return false;
                    }

                    return $inv->due_date->lt($now);
                })->count();

                return [
                    'has_debt' => $outstanding->isNotEmpty(),
                    'total_outstanding' => round((float) $total, 2),
                    'overdue_count' => $overdueCount,
                    'invoices' => $outstanding->values()->map(function (Invoice $inv) use ($now) {
                        $debt = max(0, (float) $inv->total_amount - (float) $inv->paid_amount);

                        return [
                            'id' => $inv->id,
                            'status' => $inv->status,
                            'period_start' => $inv->period_start?->format('Y-m-d'),
                            'period_end' => $inv->period_end?->format('Y-m-d'),
                            'due_date' => $inv->due_date?->format('Y-m-d'),
                            'debt' => round($debt, 2),
                            'is_overdue' => $inv->due_date && $inv->due_date->lt($now),
                        ];
                    }),
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

    private function resolveHasInvoiceDebt(): bool
    {
        return $this->debtContextInvoices()->isNotEmpty();
    }

    /**
     * Danh sách hóa đơn dùng để tính badge (list: outstandingInvoices; chi tiết: lọc từ invoices).
     *
     * @return Collection<int, Invoice>
     */
    private function debtContextInvoices(): Collection
    {
        if ($this->relationLoaded('outstandingInvoices')) {
            return $this->outstandingInvoices;
        }

        if ($this->relationLoaded('invoices')) {
            return $this->outstandingDebtInvoices();
        }

        return collect();
    }

    /**
     * @return Collection<int, Invoice>
     */
    private function outstandingDebtInvoices(): Collection
    {
        if (! $this->relationLoaded('invoices')) {
            return collect();
        }

        $statuses = Invoice::outstandingDebtStatuses();

        return $this->invoices->filter(function (Invoice $inv) use ($statuses) {
            if (! in_array($inv->status, $statuses, true)) {
                return false;
            }

            $debt = (float) $inv->total_amount - (float) $inv->paid_amount;

            return $debt > 0.009;
        })->sortBy(fn (Invoice $inv) => $inv->due_date?->timestamp ?? PHP_INT_MAX)
            ->values();
    }
}
