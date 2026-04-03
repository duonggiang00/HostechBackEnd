<?php

namespace Tests\Feature\Contract;

use App\Features\Contract\Enums\ContractStatus;
use App\Features\Contract\Enums\DepositStatus;
use App\Features\Contract\Models\Contract;
use App\Features\Handover\Models\Handover;
use App\Features\Meter\Models\Meter;
use App\Features\Meter\Models\MeterReading;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;
use App\Features\Property\Models\RoomAsset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Spatie\Permission\Models\Role;

class ContractHandoverIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Tenant']);
    }

    public function test_contract_activated_event_creates_checkin_handover_with_cloned_items()
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'available'
        ]);

        RoomAsset::create([
            'id' => Str::uuid(),
            'org_id' => $org->id,
            'room_id' => $room->id,
            'name' => 'Air Conditioner',
            'condition' => 'GOOD',
        ]);

        // Service
        $service = \App\Features\Service\Models\Service::factory()->create([
            'org_id' => $org->id,
        ]);

        $meter = Meter::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'service_id' => $service->id,
            'is_active' => true
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::PENDING_PAYMENT,
            'deposit_status' => DepositStatus::PENDING,
            'deposit_amount' => 5000000,
            'rent_price' => 3000000,
        ]);

        $tenant = User::factory()->create(['org_id' => $org->id]);
        \App\Features\Contract\Models\ContractMember::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'user_id' => $tenant->id,
            'full_name' => $tenant->full_name,
            'phone' => '0987654321',
            'is_primary' => true,
            'status' => 'APPROVED',
        ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/confirm-payment")
            ->assertStatus(200);

        // Assert Handover CHECKIN was created
        $this->assertDatabaseHas('handovers', [
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'org_id' => $org->id,
            'type' => 'CHECKIN',
            'status' => 'DRAFT',
        ]);

        $handover = Handover::where('contract_id', $contract->id)->where('type', 'CHECKIN')->first();

        // Assert items cloned
        $this->assertDatabaseHas('handover_items', [
            'handover_id' => $handover->id,
            'name' => 'Air Conditioner',
            'status' => 'OK',
            'note' => 'Tình trạng: GOOD'
        ]);

        // Assert meter snapshot
        $this->assertDatabaseHas('handover_meter_snapshots', [
            'handover_id' => $handover->id,
            'meter_id' => $meter->id,
            'reading_value' => null
        ]);
    }

    public function test_contract_terminated_event_creates_checkout_handover_with_last_meter_reading()
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied'
        ]);

        // Setup Meter with initial and last reading
        $service = \App\Features\Service\Models\Service::factory()->create([
            'org_id' => $org->id,
        ]);

        $meter = Meter::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'service_id' => $service->id,
            'is_active' => true
        ]);

        MeterReading::factory()->create([
            'org_id' => $org->id,
            'meter_id' => $meter->id,
            'reading_value' => 100,
            'period_end' => now()->subMonth()
        ]);

        MeterReading::factory()->create([
            'org_id' => $org->id,
            'meter_id' => $meter->id,
            'reading_value' => 250, // This is the last reading
            'period_end' => now()
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::PAID,
            'rent_price' => 3000000,
        ]);

        $tenant = User::factory()->create(['org_id' => $org->id]);
        \App\Features\Contract\Models\ContractMember::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'user_id' => $tenant->id,
            'full_name' => $tenant->full_name,
            'phone' => '0987654321',
            'is_primary' => true,
            'status' => 'APPROVED',
        ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => now()->format('Y-m-d'),
                'reason' => 'Normal termination',
                'forfeit_deposit' => false,
            ])
            ->assertStatus(200);

        // Assert Handover CHECKOUT was created
        $this->assertDatabaseHas('handovers', [
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'org_id' => $org->id,
            'type' => 'CHECKOUT',
            'status' => 'DRAFT',
        ]);

        $handover = Handover::where('contract_id', $contract->id)->where('type', 'CHECKOUT')->first();

        // Assert meter snapshot uses last reading (250)
        $this->assertDatabaseHas('handover_meter_snapshots', [
            'handover_id' => $handover->id,
            'meter_id' => $meter->id,
            'reading_value' => 250
        ]);
    }
}
