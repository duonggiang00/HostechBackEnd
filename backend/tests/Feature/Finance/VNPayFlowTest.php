<?php

use App\Models\Invoice\Invoice;
use App\Models\Finance\Payment;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
    
    // Set mock config for VNPay so signature is predictable
    config(['vnpay.mode' => 'sandbox']);
    config(['vnpay.tmn_code' => 'TESTTMN']);
    config(['vnpay.hash_secret' => 'TESTSECRETKEYDOINGTEST123456789']);
    config(['vnpay.trust_return_as_ipn' => true]);
});

test('vnpay payment flow: create url -> ipn updates status -> invoice paid', function () {
    // 1. Chuẩn bị dữ liệu
    $org = Org::factory()->create();
    \App\Services\TenantManager::setOrgId($org->id);

    $owner = User::factory()->create(['org_id' => $org->id]);
    $owner->assignRole('Owner');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor    = \App\Models\Property\Floor::factory()
        ->create(['org_id' => $org->id, 'property_id' => $property->id]);
    $room     = \App\Models\Property\Room::factory()
        ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);
    $contract = \App\Models\Contract\Contract::factory()
        ->create([
            'org_id'      => $org->id,
            'property_id' => $property->id,
            'room_id'     => $room->id,
        ]);
    
    // Tạo 1 hóa đơn cần thanh toán
    $invoice = Invoice::factory()->create([
        'org_id'       => $org->id,
        'property_id'  => $property->id,
        'room_id'      => $room->id,
        'contract_id'  => $contract->id,
        'status'       => 'ISSUED',
        'total_amount' => 5000000,
        'paid_amount'  => 0,
    ]);

    actingAs($owner);

    // =========================================================================
    // STEP 1: Khởi tạo thanh toán VNPay (Frontend gọi báo tạo URL)
    // =========================================================================
    // =========================================================================
    // STEP 1: Khởi tạo thanh toán VNPay (Frontend gọi báo tạo URL)
    // =========================================================================
    $response = postJson('/api/finance/vnpay/create', [
        'org_id'        => $org->id,
        'property_id'   => $property->id,
        'payer_user_id' => $owner->id,
        'method'        => 'QR',
        'amount'        => 5000000,
        'note'          => 'Thanh toan test VNPAY',
        'allocations'   => [
            [
                'invoice_id' => $invoice->id,
                'amount'     => 5000000,
            ]
        ]
    ]);

    $response->assertStatus(201);
    $response->assertJsonStructure(['payment_url', 'data' => ['id', 'status']]);
    
    $paymentId = $response->json('data.id');
    $paymentUrl = $response->json('payment_url');
    
    expect($response->json('data.status'))->toBe('PENDING'); // Chờ webhook
    expect($paymentUrl)->toContain('TESTTMN'); // URL có TmnCode
    
    // =========================================================================
    // STEP 2: Giả lập IPN Webhook gửi từ VNPay server
    // =========================================================================
    $params = [
        'vnp_Version'            => '2.1.0',
        'vnp_Command'            => 'pay',
        'vnp_TmnCode'            => 'TESTTMN',
        'vnp_Amount'             => 5000000 * 100, // VNPay amount = tiền Vnd * 100
        'vnp_BankCode'           => 'NCB',
        'vnp_BankTranNo'         => 'VNP12345',
        'vnp_CardType'           => 'ATM',
        'vnp_PayDate'            => now()->format('YmdHis'),
        'vnp_OrderInfo'          => 'Thanh toan hoa don test',
        'vnp_TransactionNo'      => 'VNP9999999',
        'vnp_ResponseCode'       => '00', // 00 là thành công
        'vnp_TransactionStatus'  => '00',
        'vnp_TxnRef'             => $paymentId,
    ];

    // Tạo chữ ký (như server VNPay tạo và trả về)
    ksort($params);
    $queryString = http_build_query($params);
    $secureHash = strtoupper(hash_hmac('sha512', $queryString, config('vnpay.hash_secret')));
    $params['vnp_SecureHash'] = $secureHash;

    // Gửi IPN request (Webhook là public endpoint)
    // Lưu ý: call không có token
    $webhookRes = $this->postJson('/api/finance/vnpay/ipn', $params);
    
    $webhookRes->assertStatus(200);
    $webhookRes->assertJson(['RspCode' => '00', 'Message' => 'Confirm Success']);

    // =========================================================================
    // STEP 3: Kiểm tra database sau khi gạch nợ thành công
    // =========================================================================
    $payment = Payment::find($paymentId);
    
    expect($payment->status)->toBe('APPROVED');
    expect($payment->provider_ref)->toBe('VNP9999999');
    expect($payment->provider_status)->toBe('SUCCESS');
    
    $invoice->refresh();
    
    // Hóa đơn đã được gạch hết nợ và chuyển trạng thái
    expect((float)$invoice->paid_amount)->toBe(5000000.0);
    expect($invoice->status)->toBe('PAID');

    // =========================================================================
    // STEP 4: Frontend verify (Redirect URL)
    // =========================================================================
    actingAs($owner);
    $verifyRes = getJson("/api/finance/vnpay/verify?txn_ref={$paymentId}");
    
    $verifyRes->assertStatus(200);
    $verifyRes->assertJson([
        'success' => true,
        'provider_status' => 'SUCCESS'
    ]);
});

test('vnpay sandbox local flow: verify endpoint can finalize payment from return params when ipn is unavailable', function () {
    $org = Org::factory()->create();
    \App\Services\TenantManager::setOrgId($org->id);

    $owner = User::factory()->create(['org_id' => $org->id]);
    $owner->assignRole('Owner');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor    = \App\Models\Property\Floor::factory()
        ->create(['org_id' => $org->id, 'property_id' => $property->id]);
    $room     = \App\Models\Property\Room::factory()
        ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);
    $contract = \App\Models\Contract\Contract::factory()
        ->create([
            'org_id'      => $org->id,
            'property_id' => $property->id,
            'room_id'     => $room->id,
        ]);

    $invoice = Invoice::factory()->create([
        'org_id'       => $org->id,
        'property_id'  => $property->id,
        'room_id'      => $room->id,
        'contract_id'  => $contract->id,
        'status'       => 'ISSUED',
        'total_amount' => 3250000,
        'paid_amount'  => 0,
    ]);

    actingAs($owner);

    $createRes = postJson('/api/finance/vnpay/create', [
        'org_id'        => $org->id,
        'property_id'   => $property->id,
        'payer_user_id' => $owner->id,
        'method'        => 'QR',
        'amount'        => 3250000,
        'note'          => 'Thanh toan sandbox local',
        'allocations'   => [
            [
                'invoice_id' => $invoice->id,
                'amount'     => 3250000,
            ],
        ],
    ]);

    $createRes->assertStatus(201);
    $paymentId = $createRes->json('data.id');

    $params = [
        'vnp_Version'           => '2.1.0',
        'vnp_Command'           => 'pay',
        'vnp_TmnCode'           => 'TESTTMN',
        'vnp_Amount'            => 3250000 * 100,
        'vnp_BankCode'          => 'NCB',
        'vnp_BankTranNo'        => 'RETURN12345',
        'vnp_CardType'          => 'ATM',
        'vnp_PayDate'           => now()->format('YmdHis'),
        'vnp_OrderInfo'         => 'Sandbox local return',
        'vnp_TransactionNo'     => 'RETURN9999999',
        'vnp_ResponseCode'      => '00',
        'vnp_TransactionStatus' => '00',
        'vnp_TxnRef'            => $paymentId,
    ];

    ksort($params);
    $queryString = http_build_query($params);
    $params['vnp_SecureHash'] = strtoupper(hash_hmac('sha512', $queryString, config('vnpay.hash_secret')));

    $verifyRes = getJson('/api/finance/vnpay/verify?' . http_build_query($params));

    $verifyRes->assertStatus(200);
    $verifyRes->assertJson([
        'payment_id' => $paymentId,
        'success' => true,
        'provider_status' => 'SUCCESS',
    ]);

    $payment = Payment::find($paymentId);
    expect($payment)->not->toBeNull();
    expect($payment->status)->toBe('APPROVED');
    expect($payment->provider_ref)->toBe('RETURN9999999');

    $invoice->refresh();
    expect((float) $invoice->paid_amount)->toBe(3250000.0);
    expect($invoice->status)->toBe('PAID');
});

test('vnpay create rejects placeholder sandbox config before redirecting user to gateway', function () {
    config(['vnpay.tmn_code' => 'DEMO']);
    config(['vnpay.hash_secret' => '']);

    $org = Org::factory()->create();
    \App\Services\TenantManager::setOrgId($org->id);

    $owner = User::factory()->create(['org_id' => $org->id]);
    $owner->assignRole('Owner');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor    = \App\Models\Property\Floor::factory()
        ->create(['org_id' => $org->id, 'property_id' => $property->id]);
    $room     = \App\Models\Property\Room::factory()
        ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);
    $contract = \App\Models\Contract\Contract::factory()
        ->create([
            'org_id'      => $org->id,
            'property_id' => $property->id,
            'room_id'     => $room->id,
        ]);

    $invoice = Invoice::factory()->create([
        'org_id'       => $org->id,
        'property_id'  => $property->id,
        'room_id'      => $room->id,
        'contract_id'  => $contract->id,
        'status'       => 'ISSUED',
        'total_amount' => 1000000,
        'paid_amount'  => 0,
    ]);

    actingAs($owner);

    $response = postJson('/api/finance/vnpay/create', [
        'org_id'        => $org->id,
        'property_id'   => $property->id,
        'payer_user_id' => $owner->id,
        'method'        => 'QR',
        'amount'        => 1000000,
        'note'          => 'Thiếu cấu hình sandbox',
        'allocations'   => [
            [
                'invoice_id' => $invoice->id,
                'amount'     => 1000000,
            ],
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment([
        'message' => 'VNPay sandbox chưa được cấu hình đầy đủ. Hãy cập nhật VNPAY_TMN_CODE và VNPAY_HASH_SECRET trong backend/.env trước khi thanh toán.',
    ]);
});
