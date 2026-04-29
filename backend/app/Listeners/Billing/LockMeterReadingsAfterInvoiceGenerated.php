<?php

namespace App\Listeners\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Models\Meter\MeterReading;
use Illuminate\Support\Collection;

class LockMeterReadingsAfterInvoiceGenerated
{
    public function handle(InvoiceGenerated $event): void
    {
        $invoice = $event->invoice->loadMissing('items');

        // Chỉ lock sau khi hóa đơn đã phát hành/thanh toán.
        if (! in_array($invoice->status, ['ISSUED', 'PAID'], true)) {
            return;
        }

        $periodStart = optional($invoice->period_start)?->toDateString();
        $periodEnd = optional($invoice->period_end)?->toDateString();
        if (! $periodStart || ! $periodEnd) {
            return;
        }

        /** @var Collection<int, array{meter_id:string,curr_reading:int|null}> $meterRefs */
        $meterRefs = $invoice->items
            ->map(function ($item) {
                $meta = is_array($item->meta) ? $item->meta : [];
                $meterId = $meta['meter_id'] ?? null;
                if (! is_string($meterId) || $meterId === '') {
                    return null;
                }

                $currReading = isset($meta['curr_reading']) ? (int) $meta['curr_reading'] : null;

                return [
                    'meter_id' => $meterId,
                    'curr_reading' => $currReading,
                ];
            })
            ->filter()
            ->unique(fn (array $row) => $row['meter_id'])
            ->values();

        if ($meterRefs->isEmpty()) {
            return;
        }

        $now = now();

        foreach ($meterRefs as $ref) {
            $query = MeterReading::query()
                ->where('meter_id', $ref['meter_id'])
                ->whereDate('period_start', $periodStart)
                ->whereDate('period_end', $periodEnd)
                ->where('status', 'APPROVED');

            if (! is_null($ref['curr_reading'])) {
                $query->where('reading_value', $ref['curr_reading']);
            }

            $query->update([
                'status' => 'LOCKED',
                'locked_at' => $now,
            ]);
        }
    }
}

