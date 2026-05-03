<?php

namespace Tests\Unit;

use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Invoice\InvoiceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceServiceSyncPaidAmountTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_caps_paid_when_total_drops_below_paid_after_recalc(): void
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
        ]);
        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
        ]);

        $invoice = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end' => now()->endOfMonth()->toDateString(),
                'status' => 'PARTIAL',
                'total_amount' => 400.00,
                'paid_amount' => 500.00,
                'is_termination' => false,
            ]);

        app(InvoiceService::class)->syncInvoicePaidAmountAfterTotalRecalc($invoice->fresh());

        $invoice->refresh();
        $this->assertEquals('PAID', $invoice->status);
        $this->assertEquals('400.00', $invoice->paid_amount);
    }

    public function test_sync_keeps_partial_when_outstanding_remains(): void
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
        ]);
        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
        ]);

        $invoice = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end' => now()->endOfMonth()->toDateString(),
                'status' => 'PARTIAL',
                'total_amount' => 1000.00,
                'paid_amount' => 300.00,
                'is_termination' => false,
            ]);

        app(InvoiceService::class)->syncInvoicePaidAmountAfterTotalRecalc($invoice->fresh());

        $invoice->refresh();
        $this->assertEquals('PARTIAL', $invoice->status);
        $this->assertEqualsWithDelta(300.0, (float) $invoice->paid_amount, 0.01);
    }
}
