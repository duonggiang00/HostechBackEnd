<?php

namespace Tests\Feature\Finance;

use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Org\Org;
use App\Services\Finance\LedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LedgerRecordIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_record_payment_ledger_is_idempotent_on_duplicate_calls(): void
    {
        $org = Org::factory()->create();

        $payment = Payment::create([
            'org_id' => $org->id,
            'property_id' => null,
            'payer_user_id' => null,
            'received_by_user_id' => null,
            'method' => 'CASH',
            'amount' => 100_000,
            'reference' => 'idem-test',
            'received_at' => now(),
            'status' => 'APPROVED',
        ]);

        /** @var LedgerService $ledger */
        $ledger = app(LedgerService::class);

        $ledger->recordPayment($payment);
        $ledger->recordPayment($payment);

        $this->assertSame(2, LedgerEntry::where('ref_type', 'payment')->where('ref_id', $payment->id)->count());
    }

    public function test_reverse_payment_ledger_is_idempotent_on_duplicate_calls(): void
    {
        $org = Org::factory()->create();

        $payment = Payment::create([
            'org_id' => $org->id,
            'property_id' => null,
            'payer_user_id' => null,
            'received_by_user_id' => null,
            'method' => 'CASH',
            'amount' => 50_000,
            'reference' => 'idem-rev',
            'received_at' => now(),
            'status' => 'VOIDED',
        ]);

        /** @var LedgerService $ledger */
        $ledger = app(LedgerService::class);

        $ledger->reversePayment($payment);
        $ledger->reversePayment($payment);

        $this->assertSame(2, LedgerEntry::where('ref_type', 'payment_reversal')->where('ref_id', $payment->id)->count());
    }
}
