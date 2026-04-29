<?php

use App\Events\Finance\PaymentSuccessfullyVerified;
use App\Events\Finance\ReceiptGenerated;
use App\Listeners\Finance\GeneratePaymentReceipt;
use App\Listeners\Finance\NotifyTenantPaymentReceived;
use App\Models\Finance\Payment;
use App\Models\Finance\Receipt;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Notifications\Finance\PaymentReceivedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->org = Org::factory()->create();
    $this->property = Property::factory()->create(['org_id' => $this->org->id]);
    $this->tenant = User::factory()->create(['org_id' => $this->org->id]);
});

test('payment verified triggers receipt generation and tenant notification via EDA', function () {
    Event::fake([
        ReceiptGenerated::class,
    ]);

    Notification::fake();

    $payment = Payment::create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'payer_user_id' => $this->tenant->id,
        'received_by_user_id' => $this->tenant->id,
        'method' => 'CASH',
        'amount' => 500000,
        'status' => 'APPROVED',
        'approved_at' => now(),
        'approved_by_user_id' => $this->tenant->id,
        'received_at' => now(),
    ]);

    $listener = app(GeneratePaymentReceipt::class);
    $listener->handle(new PaymentSuccessfullyVerified($payment));

    $this->assertDatabaseHas('receipts', [
        'payment_id' => $payment->id,
        'org_id' => $this->org->id,
        'kind' => Receipt::KIND_OFFICIAL,
    ]);

    $receipt = Receipt::where('payment_id', $payment->id)->where('kind', Receipt::KIND_OFFICIAL)->first();
    expect($receipt->path)->not->toBeNull();
    Storage::disk('public')->assertExists($receipt->path);

    Event::assertDispatched(ReceiptGenerated::class, function ($event) use ($receipt) {
        return $event->receipt->id === $receipt->id;
    });

    $notifyListener = app(NotifyTenantPaymentReceived::class);
    $notifyListener->handle(new ReceiptGenerated($receipt));

    $tenant = $this->tenant;

    Notification::assertSentTo(
        $tenant,
        PaymentReceivedNotification::class,
        function ($notification) use ($tenant) {
            $data = $notification->toArray($tenant);

            return ! empty($data['receipt_url']) && str_contains($data['receipt_url'], 'storage/receipts/');
        }
    );
});
