<?php

namespace Tests\Feature\Contract;

use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Contract\ContractService;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests cho công thức cọc mới: deposit = (rent_price + fixed_services_fee) × deposit_months,
 * cùng việc lưu cột `deposit_months` minh bạch trong DB.
 */
class ContractServiceCreateDepositTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::firstOrCreate(['name' => 'Admin']));
    }

    private function makeBaseData(string $orgId, string $propertyId, string $roomId): array
    {
        return [
            'org_id' => $orgId,
            'property_id' => $propertyId,
            'room_id' => $roomId,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(12)->toDateString(),
            'rent_price' => 5_000_000,
            'billing_cycle' => 1,
            'due_day' => 5,
            'cutoff_day' => 25,
            'members' => [[
                'is_primary' => true,
                'full_name' => 'Người Thuê Test',
                'identity_number' => '123456789',
                'phone' => '0900000001',
                'role' => 'TENANT',
                'date_of_birth' => '1990-01-01',
            ]],
        ];
    }

    public function test_persists_deposit_months_from_request_and_calculates_amount(): void
    {
        $org = Org::factory()->create();
        $this->admin->update(['org_id' => $org->id]);

        $property = Property::factory()->create(['org_id' => $org->id, 'default_deposit_months' => 1]);
        $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

        $data = $this->makeBaseData($org->id, $property->id, $room->id);
        $data['deposit_months'] = 3;
        // KHÔNG gửi deposit_amount → BE auto-tính theo công thức.

        $contract = app(ContractService::class)->create($data, $this->admin);

        // total_rent = rent_price + fixed_services_fee (= 0 vì không gắn dịch vụ)
        $this->assertSame(3, (int) $contract->deposit_months);
        $this->assertSame(5_000_000.0, (float) $contract->total_rent);
        $this->assertSame(15_000_000.0, (float) $contract->deposit_amount);
    }

    public function test_falls_back_to_property_default_deposit_months(): void
    {
        $org = Org::factory()->create();
        $this->admin->update(['org_id' => $org->id]);

        $property = Property::factory()->create(['org_id' => $org->id, 'default_deposit_months' => 2]);
        $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

        $data = $this->makeBaseData($org->id, $property->id, $room->id);
        // Không gửi deposit_months → BE dùng property.default_deposit_months = 2.

        $contract = app(ContractService::class)->create($data, $this->admin);

        $this->assertSame(2, (int) $contract->deposit_months);
        $this->assertSame(10_000_000.0, (float) $contract->deposit_amount);
    }

    public function test_keeps_explicit_deposit_amount_but_still_stores_months(): void
    {
        $org = Org::factory()->create();
        $this->admin->update(['org_id' => $org->id]);

        $property = Property::factory()->create(['org_id' => $org->id, 'default_deposit_months' => 1]);
        $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

        $data = $this->makeBaseData($org->id, $property->id, $room->id);
        $data['deposit_months'] = 2;
        $data['deposit_amount'] = 9_999_000; // user override (BQL nhập tay)

        $contract = app(ContractService::class)->create($data, $this->admin);

        $this->assertSame(2, (int) $contract->deposit_months);
        $this->assertSame(9_999_000.0, (float) $contract->deposit_amount);
    }

    public function test_clamps_deposit_months_above_24_to_24(): void
    {
        $org = Org::factory()->create();
        $this->admin->update(['org_id' => $org->id]);

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

        // Bypass FormRequest validation by calling service trực tiếp với deposit_months=99.
        $data = $this->makeBaseData($org->id, $property->id, $room->id);
        $data['deposit_months'] = 99;

        $contract = app(ContractService::class)->create($data, $this->admin);

        $this->assertSame(24, (int) $contract->deposit_months);
    }

    public function test_clamps_deposit_months_zero_to_one(): void
    {
        $org = Org::factory()->create();
        $this->admin->update(['org_id' => $org->id]);

        $property = Property::factory()->create(['org_id' => $org->id, 'default_deposit_months' => 0]);
        $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

        $data = $this->makeBaseData($org->id, $property->id, $room->id);
        // Không gửi deposit_months; property default = 0 → clamp về 1.

        $contract = app(ContractService::class)->create($data, $this->admin);

        $this->assertSame(1, (int) $contract->deposit_months);
        $this->assertSame(5_000_000.0, (float) $contract->deposit_amount);
    }

    public function test_validator_rejects_deposit_months_above_24(): void
    {
        $org = Org::factory()->create();
        $this->admin->update(['org_id' => $org->id]);

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id, 'capacity' => 5]);

        $payload = [
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(6)->toDateString(),
            'rent_price' => 5_000_000,
            'deposit_months' => 99,
            'billing_cycle' => 1,
            'due_day' => 5,
            'cutoff_day' => 25,
            'members' => [[
                'is_primary' => true,
                'full_name' => 'Người Thuê',
                'identity_number' => '123',
                'phone' => '0900000002',
                'role' => 'TENANT',
                'date_of_birth' => '1990-01-01',
            ]],
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/contracts', $payload);

        $response->assertStatus(422)->assertJsonValidationErrors(['deposit_months']);
    }
}
