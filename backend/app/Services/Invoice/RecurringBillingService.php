<?php

namespace App\Services\Invoice;

use App\Enums\InvoiceItemType;
use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceAdjustment;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Service\Service;
use App\Services\Service\ServiceService;
use App\Support\MeterInvoiceDescription;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
            ->with('room:id,name,code,property_id')
            ->orderByDesc('start_date')
            ->get()
            ->unique('room_id')
            ->values();

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
            } catch (ValidationException $e) {
                $results['failed']++;
                $results['errors'][] = $this->formatBillingValidationErrors($e);
            } catch (\Throwable $e) {
                $results['failed']++;
                $contract->loadMissing('room');
                $results['errors'][] = $this->contractRoomLabel($contract).': '.$e->getMessage();
            }
        }

        return $results;
    }

    /**
     * Generate monthly invoices for all active contracts in a specific property.
     *
     * Runs synchronously (same contract loop as organization-level billing) so the API
     * can return per-contract success/failure and validation errors immediately.
     *
     * Chỉ một hợp đồng ACTIVE cho mỗi phòng (nếu có trùng dữ liệu, giữ bản có start_date mới nhất).
     */
    public function generateMonthlyInvoicesForProperty(string $propertyId, Carbon $periodMonth): array
    {
        $contracts = Contract::where('property_id', $propertyId)
            ->where('status', 'ACTIVE')
            ->where('start_date', '<=', $periodMonth->copy()->endOfMonth())
            ->where(function ($query) use ($periodMonth) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $periodMonth->copy()->startOfMonth());
            })
            ->with('room:id,name,code,property_id')
            ->orderByDesc('start_date')
            ->get()
            ->unique('room_id')
            ->values();

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
            } catch (ValidationException $e) {
                $results['failed']++;
                $results['errors'][] = $this->formatBillingValidationErrors($e);
            } catch (\Throwable $e) {
                $results['failed']++;
                $contract->loadMissing('room');
                $results['errors'][] = $this->contractRoomLabel($contract).': '.$e->getMessage();
            }
        }

        Log::info('[Billing] Property batch billing completed', [
            'property_id' => $propertyId,
            'period' => $periodMonth->format('Y-m'),
            'total' => $results['total'],
            'success' => $results['success'],
            'failed' => $results['failed'],
        ]);

        return $results;
    }

    protected function formatBillingValidationErrors(ValidationException $e): string
    {
        $messages = collect($e->errors())->flatten()->filter()->values();

        return $messages->isNotEmpty() ? $messages->implode(' ') : $e->getMessage();
    }

    /**
     * Nhãn phòng cho thông báo chốt tháng (không dùng UUID hợp đồng trong UI).
     */
    protected function contractRoomLabel(Contract $contract): string
    {
        $contract->loadMissing('room');
        $room = $contract->room;
        if (! $room) {
            return 'Một phòng (chưa gắn phòng trên hợp đồng)';
        }

        $name = trim((string) ($room->name ?? ''));
        $code = trim((string) ($room->code ?? ''));

        if ($name !== '' && $code !== '' && strcasecmp($name, $code) !== 0) {
            return "Phòng {$name} ({$code})";
        }

        return $name !== '' ? "Phòng {$name}" : ($code !== '' ? "Phòng {$code}" : 'Một phòng');
    }

    /**
     * Generate a recurring invoice for a specific contract.
     * Optionally accepts custom period start and end dates.
     */
    public function generateInvoiceForContract(Contract $contract, Carbon $periodMonth, ?Carbon $customPeriodStart = null, ?Carbon $customPeriodEnd = null)
    {
        return DB::transaction(function () use ($contract, $periodMonth, $customPeriodStart, $customPeriodEnd) {
            $fullMonthStart = $periodMonth->copy()->startOfMonth();
            $fullMonthEnd = $periodMonth->copy()->endOfMonth();

            // Auto-prorate: if contract starts mid-month, effective period begins at start_date
            $contractStart = Carbon::parse($contract->start_date)->startOfDay();
            $contractEnd = $contract->end_date ? Carbon::parse($contract->end_date)->startOfDay() : null;

            $periodStart = $customPeriodStart
                ?? ($contractStart->gt($fullMonthStart) ? $contractStart->copy() : $fullMonthStart);
            $periodEnd = $customPeriodEnd
                ?? ($contractEnd && $contractEnd->lt($fullMonthEnd) ? $contractEnd->copy() : $fullMonthEnd);

            // ── Duplicate check: khớp unique DB (contract_id + period_start + period_end) ──
            $existing = Invoice::where('contract_id', $contract->id)
                ->whereDate('period_start', $periodStart->toDateString())
                ->whereDate('period_end', $periodEnd->toDateString())
                ->where('is_termination', false)          // hóa đơn thanh lý không được tính là trùng lặp
                ->whereNotIn('status', ['CANCELLED'])
                ->first();

            if ($existing) {
                $contract->loadMissing('room');
                $who = $this->contractRoomLabel($contract);
                $statusLabel = match ($existing->status) {
                    'ISSUED' => 'đã phát hành',
                    'PARTIAL' => 'đã thanh toán một phần',
                    'PAID' => 'đã thanh toán',
                    'DRAFT' => 'đang ở bản nháp',
                    'OVERDUE' => 'đã phát hành (quá hạn)',
                    default => strtolower((string) $existing->status),
                };
                throw new \Exception(
                    "{$who} — Kỳ {$periodStart->format('d/m/Y')}–{$periodEnd->format('d/m/Y')}: đã có hóa đơn ({$statusLabel}), không tạo thêm để tránh trùng."
                );
            }
            // ───────────────────────────────────────────────────────────────────

            $items = [];
            $usedReadingIds = [];

            // 1. Basic Rent via Token Logic
            if ($contract->rent_token_balance > 0) {
                // Consume 1 token for this month, no rent item added to invoice
                $contract->decrement('rent_token_balance', 1);
            } else {
                // Balance is 0, need to charge rent based on billing cycle
                $cycleMonths = $this->resolveBillingCycleMonths($contract->billing_cycle);
                $baseRent = (float) $contract->base_rent;

                // Pro-rate rent for partial months (e.g. new tenant moved in mid-month)
                $isPartialMonth = $cycleMonths === 1
                    && (! $periodStart->isSameDay($fullMonthStart) || ! $periodEnd->isSameDay($fullMonthEnd));

                if ($isPartialMonth) {
                    $daysInPeriod = (int) $periodStart->diffInDays($periodEnd) + 1;
                    $daysInFullMonth = (int) $fullMonthStart->daysInMonth;
                    $rentAmount = round($baseRent * $daysInPeriod / $daysInFullMonth);
                    $desc = 'Tiền phòng (tính theo ngày) '.$periodStart->format('d/m').' - '.$periodEnd->format('d/m/Y')
                        ." ({$daysInPeriod}/{$daysInFullMonth} ngày)";
                    $items[] = [
                        'type' => InvoiceItemType::RENT->value,
                        'description' => $desc,
                        'quantity' => $daysInPeriod,
                        'unit_price' => round($baseRent / $daysInFullMonth),
                        'amount' => $rentAmount,
                    ];
                } else {
                    $desc = $cycleMonths === 1
                        ? 'Tiền phòng chu kỳ '.$periodStart->format('d/m').' - '.$periodEnd->format('d/m/Y')
                        : 'Tiền phòng chu kỳ '.$cycleMonths.' tháng';

                    $items[] = [
                        'type' => InvoiceItemType::RENT->value,
                        'description' => $desc,
                        'quantity' => $cycleMonths,
                        'unit_price' => $baseRent,
                        'amount' => $baseRent * $cycleMonths,
                    ];

                    if ($cycleMonths > 1) {
                        // Add purchased tokens minus 1 (because 1 is consumed for the current month)
                        $contract->increment('rent_token_balance', $cycleMonths - 1);
                    }
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

            $missingMeterTypes = [];
            $missingServiceMeterTypes = [];

            foreach ($meters as $meter) {
                /** @var Meter $meter */
                $usageData = $this->calculateMeterUsage($meter, $periodStart, $periodEnd, $contract->room_id, $contract->org_id);

                if (isset($usageData['_error'])) {
                    if ($usageData['_error'] === 'no_reading') {
                        $missingMeterTypes[] = $meter->type;
                    } else {
                        $missingServiceMeterTypes[] = $meter->type;
                    }

                    continue;
                }

                $usedReadingIds[] = $usageData['reading_id'];
                $items[] = [
                    'type' => InvoiceItemType::SERVICE->value,
                    'description' => MeterInvoiceDescription::forUsage(
                        (string) $usageData['service_name'],
                        $meter->type,
                        $usageData['usage']
                    ),
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

            // ── Strict Validation: thiếu chỉ số đã chốt / thiếu dịch vụ gắn phòng ──
            $meterNames = [
                'ELECTRIC' => 'Điện',
                'WATER' => 'Nước',
                'GAS' => 'Ga',
            ];

            if (! empty($missingServiceMeterTypes)) {
                $labels = array_map(fn ($type) => $meterNames[$type] ?? $type, $missingServiceMeterTypes);
                $contract->loadMissing('room');
                $who = $this->contractRoomLabel($contract);
                $joined = implode(' và ', $labels);
                throw ValidationException::withMessages([
                    'meters' => "{$who} — Kỳ {$periodStart->format('d/m/Y')}–{$periodEnd->format('d/m/Y')}: đồng hồ {$joined} đã có chỉ số chốt nhưng chưa gắn dịch vụ đúng loại trên phòng (room_services). Vui lòng cấu hình dịch vụ phòng rồi chạy lại.",
                ]);
            }

            if (! empty($missingMeterTypes)) {
                $labels = array_map(fn ($type) => $meterNames[$type] ?? $type, $missingMeterTypes);

                $contract->loadMissing('room');
                $who = $this->contractRoomLabel($contract);
                $joined = implode(' và ', $labels);
                throw ValidationException::withMessages([
                    'meters' => "{$who} — Kỳ {$periodStart->format('d/m/Y')}–{$periodEnd->format('d/m/Y')}: chưa có chỉ số {$joined} đã duyệt/chốt. Vui lòng chốt số đồng hồ (period_end trong tháng này) rồi chạy lại chốt tháng.",
                ]);
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

            // 5. Readings are automatically locked by InvoiceService::create()
            // when it detects 'meter_id' and 'curr_reading' in items metadata.

            // 6. Automatic Credit Offset handling (Dùng Ví Dư nợ)
            $meta = $contract->meta ?? [];
            if (isset($meta['credit_balance']) && $meta['credit_balance'] > 0) {
                // Xác định số tiền có thể cấn trừ tối đa
                $availableCredit = (float) $meta['credit_balance'];
                $currentTotal = $invoice->total_amount;

                if ($currentTotal > 0) {
                    $appliedCredit = min($availableCredit, $currentTotal);

                    // Sinh phiếu giảm trừ
                    InvoiceAdjustment::create([
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
     *
     * @return array<string, mixed>|array{_error: 'no_reading'|'no_service'}
     */
    public function calculateMeterUsage(Meter $meter, Carbon $periodStart, Carbon $periodEnd, ?string $roomId = null, ?string $orgId = null)
    {
        // Find the reading for this period
        $currentReading = MeterReading::where('meter_id', $meter->id)
            ->whereBetween('period_end', [$periodStart, $periodEnd])
            ->whereIn('status', MeterReading::FINALIZED_STATUSES)
            ->orderBy('period_end', 'desc')
            ->first();

        if (! $currentReading) {
            return ['_error' => 'no_reading'];
        }

        // Find the previous reading
        $previousReading = MeterReading::where('meter_id', $meter->id)
            ->where('period_end', '<', $currentReading->period_end)
            ->whereIn('status', MeterReading::FINALIZED_STATUSES)
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
            return ['_error' => 'no_service'];
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
                        'tier' => "{$tier->tier_from}".($tier->tier_to ? " - {$tier->tier_to}" : '+'),
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
            'reading_id' => $currentReading->id,
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
            return Service::where('type', $meter->type)
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
