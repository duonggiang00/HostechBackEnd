<?php

namespace App\Services\Invoice;

use App\Enums\InvoiceItemType;
use App\Models\Contract\Contract;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Services\Service\ServiceService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RecurringBillingService
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected ServiceService $serviceService
    ) {}

    /**
     * Generate monthly invoices for all active contracts in an organization.
     */
    public function generateMonthlyInvoices(string $orgId, Carbon $periodMonth)
    {
        $contracts = Contract::where('org_id', $orgId)
            ->where('status', 'ACTIVE')
            ->where('start_date', '<=', $periodMonth->copy()->endOfMonth())
            ->where(function ($query) use ($periodMonth) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $periodMonth->copy()->startOfMonth());
            })
            ->get();

        $results = [
            'total' => $contracts->count(),
            'success' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        foreach ($contracts as $contract) {
            /** @var Contract $contract */
            try {
                $this->generateInvoiceForContract($contract, $periodMonth);
                $results['success']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = "Contract {$contract->id}: " . $e->getMessage();
            }
        }

        return $results;
    }

    /**
     * Generate a recurring invoice for a specific contract.
     */
    public function generateInvoiceForContract(Contract $contract, Carbon $periodMonth)
    {
        return DB::transaction(function () use ($contract, $periodMonth) {
            $periodStart = $periodMonth->copy()->startOfMonth();
            $periodEnd = $periodMonth->copy()->endOfMonth();

            // ── Duplicate check: tránh tạo 2 hóa đơn cho cùng kỳ ──────────────
            $existing = \App\Models\Invoice\Invoice::where('contract_id', $contract->id)
                ->where('period_start', $periodStart->toDateString())
                ->whereNotIn('status', ['CANCELLED'])
                ->first();

            if ($existing) {
                throw new \Exception(
                    "Hóa đơn cho kỳ {$periodStart->format('m/Y')} đã tồn tại (ID: {$existing->id}, trạng thái: {$existing->status})."
                );
            }
            // ───────────────────────────────────────────────────────────────────

            $items = [];


            // 1. Basic Rent via Token Logic
            if ($contract->rent_token_balance > 0) {
                // Consume 1 token for this month, no rent item added to invoice
                $contract->decrement('rent_token_balance', 1);
            } else {
                // Balance is 0, need to charge rent based on billing cycle
                $cycleMonths = $this->resolveBillingCycleMonths($contract->billing_cycle);
                
                $desc = $cycleMonths === 1 
                    ? 'Tiền phòng tháng ' . $periodMonth->format('m/Y')
                    : 'Tiền phòng chu kỳ ' . $cycleMonths . ' tháng';

                $items[] = [
                    'type' => InvoiceItemType::RENT->value,
                    'description' => $desc,
                    'quantity' => $cycleMonths,
                    'unit_price' => (float) $contract->base_rent,
                    'amount' => ((float) $contract->base_rent) * $cycleMonths,
                ];

                if ($cycleMonths > 1) {
                    // Add purchased tokens minus 1 (because 1 is consumed for the current month)
                    $contract->increment('rent_token_balance', $cycleMonths - 1);
                }
            }

            // 2. Fixed Services (WiFi, Trash, etc.)
            $roomServices = $this->serviceService->getRoomServices($contract->room_id, $contract->org_id);
            foreach ($roomServices as $rs) {
                if ($rs->service->calc_mode !== 'PER_METER') {
                    $itemAmount = (float) ($rs->service->current_price * $rs->quantity);
                    $items[] = [
                        'type' => InvoiceItemType::SERVICE->value,
                        'description' => "Phí dịch vụ: {$rs->service->name}",
                        'quantity' => $rs->quantity,
                        'unit_price' => (float) $rs->service->current_price,
                        'amount' => $itemAmount,
                    ];
                }
            }

            // 3. Metered Services (Electricity, Water, etc.)
            $meters = Meter::where('room_id', $contract->room_id)
                ->where('is_active', true)
                ->get();

            foreach ($meters as $meter) {
                /** @var Meter $meter */
                $usageData = $this->calculateMeterUsage($meter, $periodStart, $periodEnd, $contract->room_id, $contract->org_id);
                if ($usageData) {
                    $items[] = [
                        'type' => InvoiceItemType::SERVICE->value,
                        'description' => "Tiền {$usageData['service_name']} ({$usageData['usage']} {$meter->type})",
                        'quantity' => $usageData['usage'],
                        'unit_price' => $usageData['average_price'],
                        'amount' => $usageData['total_amount'],
                        'meta' => [
                            'meter_id' => $meter->id,
                            'prev_reading' => $usageData['prev_reading'],
                            'curr_reading' => $usageData['curr_reading'],
                            'tiers' => $usageData['tiers_breakdown'],
                        ],
                    ];
                }
            }

            // 4. Create Invoice using the InvoiceService
            $invoice = $this->invoiceService->create(
                data: [
                    'org_id' => $contract->org_id,
                    'property_id' => $contract->property_id,
                    'contract_id' => $contract->id,
                    'room_id' => $contract->room_id,
                    'period_start' => $periodStart->toDateString(),
                    'period_end' => $periodEnd->toDateString(),
                    'status' => 'ISSUED',
                    'due_date' => now()->addDays(5)->toDateString(), // Configuration candidate
                ],
                itemsData: $items
            );

            // 5. Automatic Credit Offset handling (Dùng Ví Dư nợ)
            $meta = $contract->meta ?? [];
            if (isset($meta['credit_balance']) && $meta['credit_balance'] > 0) {
                // Xác định số tiền có thể cấn trừ tối đa
                $availableCredit = (float) $meta['credit_balance'];
                $currentTotal = $invoice->total_amount;
                
                if ($currentTotal > 0) {
                    $appliedCredit = min($availableCredit, $currentTotal);

                    // Sinh phiếu giảm trừ
                    \App\Models\Invoice\InvoiceAdjustment::create([
                        'org_id' => $invoice->org_id,
                        'invoice_id' => $invoice->id,
                        'type' => 'CREDIT',
                        'amount' => $appliedCredit,
                        'reason' => 'Tự động cấn trừ từ Ví Hợp đồng (Credit Balance)',
                        'created_by_user_id' => null, // Hệ thống thực hiện
                        'approved_by_user_id' => null,
                        'approved_at' => now(),
                    ]);

                    // Cập nhật lại số dư ví cho Khách
                    $meta['credit_balance'] -= $appliedCredit;
                    $contract->update(['meta' => $meta]);

                    // Tính lại bill
                    $this->invoiceService->recalculateTotalAmount($invoice);

                    // Tự động gạch nợ (PAID) nếu hóa đơn đã trừ sạch về 0
                    if ($invoice->refresh()->total_amount <= 0) {
                        $this->invoiceService->payInvoice($invoice, 'Thanh toán tự động bằng cấn trừ Ví.');
                    }
                }
            }

            return $invoice;
        });
    }

    /**
     * Calculate usage and cost for a meter during a period.
     * Dynamic Linking: Tra cứu dịch vụ qua room_services + type.
     */
    protected function calculateMeterUsage(Meter $meter, Carbon $periodStart, Carbon $periodEnd, ?string $roomId = null, ?string $orgId = null)
    {
        // Find the reading for this period
        $currentReading = MeterReading::where('meter_id', $meter->id)
            ->whereBetween('period_end', [$periodStart, $periodEnd])
            ->where('status', 'APPROVED')
            ->orderBy('period_end', 'desc')
            ->first();

        if (! $currentReading) {
            return null;
        }

        // Find the previous reading
        $previousReading = MeterReading::where('meter_id', $meter->id)
            ->where('period_end', '<', $currentReading->period_start)
            ->where('status', 'APPROVED')
            ->orderBy('period_end', 'desc')
            ->first();

        $prevValue = $previousReading ? $previousReading->reading_value : $meter->base_reading;
        $currValue = $currentReading->reading_value;
        $usage = $currValue - $prevValue;

        if ($usage < 0) {
            $usage = 0;
        }

        // ── Dynamic Service Linking ──
        // Tìm dịch vụ phù hợp qua type của đồng hồ + room_services của phòng
        $service = $this->resolveServiceForMeter($meter, $roomId, $orgId);

        if (! $service) {
            return null; // Không tìm thấy dịch vụ phù hợp cho loại đồng hồ này
        }

        $currentRate = $service->currentRate;

        // Eager load tiered rates if not already
        $currentRate->loadMissing('tieredRates');

        $totalAmount = 0;
        $tiersBreakdown = [];

        if ($currentRate->tieredRates->count() > 0) {
            $remainingUsage = $usage;
            foreach ($currentRate->tieredRates as $tier) {
                // Determine limits for this tier
                $tierLimit = ($tier->tier_to === null) ? PHP_INT_MAX : ($tier->tier_to - $tier->tier_from);
                $amountInTier = min($remainingUsage, $tierLimit);

                if ($amountInTier > 0) {
                    $tierCost = $amountInTier * $tier->price;
                    $totalAmount += $tierCost;
                    $tiersBreakdown[] = [
                        'tier' => "{$tier->tier_from}" . ($tier->tier_to ? " - {$tier->tier_to}" : '+'),
                        'usage' => $amountInTier,
                        'price' => (float) $tier->price,
                        'amount' => $tierCost,
                    ];
                    $remainingUsage -= $amountInTier;
                }
                if ($remainingUsage <= 0) {
                    break;
                }
            }
        } else {
            $totalAmount = $usage * (float) $currentRate->price;
        }

        return [
            'usage' => $usage,
            'prev_reading' => $prevValue,
            'curr_reading' => $currValue,
            'total_amount' => $totalAmount,
            'average_price' => $usage > 0 ? $totalAmount / $usage : (float) $currentRate->price,
            'tiers_breakdown' => $tiersBreakdown,
            'service_name' => $service->name,
        ];
    }

    protected function resolveServiceForMeter(Meter $meter, ?string $roomId = null, ?string $orgId = null)
    {
        $targetRoomId = $roomId ?? $meter->room_id;
        $targetOrgId = $orgId ?? $meter->org_id;

        if ($targetRoomId) {
            // Phòng: Tìm dịch vụ trong room_services có type trùng với meter.type
            return \App\Models\Service\Service::where('type', $meter->type)
                ->where('org_id', $targetOrgId)
                ->whereHas('roomServices', function ($q) use ($targetRoomId) {
                    $q->where('room_id', $targetRoomId);
                })
                ->first();
        }

        // Master meter: Trả về null vì không tham gia luồng tính tiền/hóa đơn
        return null;
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
