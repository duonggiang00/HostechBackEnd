<?php

use App\Events\Finance\PaymentApproved;
use App\Events\Finance\ReceiptGenerated;
use App\Listeners\Finance\GeneratePaymentReceipt;
use App\Listeners\Finance\NotifyTenantPaymentReceived;
use App\Models\Finance\Payment;
use App\Models\Finance\Receipt;
use App\Models\Org\Organization;
use App\Models\Org\User;
use App\Models\Property\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    
    // Setup basic entities
    $this->org = Organization::factory()->create();
    $this->property = Property::factory()->create(['org_id' => $this->org->id]);
    $this->tenant = User::factory()->create(['org_id' => $this->org->id]);
});

test('payment approved triggers receipt generation and tenant notification via EDA', function () {
    Event::fake([
        ReceiptGenerated::class,
    ]);

    Notification::fake();

    // 1. Create an approved payment
    $payment = Payment::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'payer_user_id' => $this->tenant->id,
        'status' => 'APPROVED',
        'amount' => 500000,
    ]);

    // 2. Simulate GeneratePaymentReceipt listener path
    // In a real flow, this would be queued, but we test the logic here
    $listener = app(GeneratePaymentReceipt::class);
    $listener->handle(new PaymentApproved($payment));

    // 3. Verify Receipt record and PDF file
    $this->assertDatabaseHas('receipts', [
        'payment_id' => $payment->id,
        'org_id' => $this->org->id,
    ]);

    $receipt = Receipt::where('payment_id', $payment->id)->first();
    expect($receipt->path)->not->toBeNull();
    Storage::disk('public')->assertExists($receipt->path);

    // 4. Verify ReceiptGenerated event was dispatched
    Event::assertDispatched(ReceiptGenerated::class, function ($event) use ($receipt) {
        return $event->receipt->id === $receipt->id;
    });

    // 5. Simulate NotifyTenantPaymentReceived listener path
    $notifyListener = app(NotifyTenantPaymentReceived::class);
    $notifyListener->handle(new ReceiptGenerated($receipt));

    // 6. Verify notification reaches the tenant with the link
    Notification::assertSentTo(
        $this->tenant,
        \App\Notifications\Finance\PaymentReceivedNotification::class,
        function ($notification) {
            $data = $notification->toArray($this->tenant);
            return !empty($data['receipt_url']) && str_contains($data['receipt_url'], 'storage/receipts/');
        }
    );
});
