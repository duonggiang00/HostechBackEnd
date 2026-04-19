<?php

namespace Tests\Feature\Contract;

use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Enums\ContractStatus;
use App\Models\Org\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractStoreValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Assume user is authenticated
        $this->user = User::factory()->create();
    }

    public function test_it_fails_validation_if_members_exceed_capacity()
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'capacity' => 2 // Capacity 2
        ]);

        $this->actingAs($this->user);

        // Attempting to store contract with 3 members
        $response = $this->postJson("/api/contracts", [
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE->value,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(6)->toDateString(),
            'rent_price' => 5000000,
            'deposit_amount' => 5000000,
            'members' => [
                ['is_primary' => true, 'full_name' => 'Tenant 1', 'identity_number' => '111', 'phone' => '0999'],
                ['is_primary' => false, 'full_name' => 'Tenant 2', 'identity_number' => '222', 'phone' => '0888'],
                ['is_primary' => false, 'full_name' => 'Tenant 3', 'identity_number' => '333', 'phone' => '0777'],
            ]
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['members']);
                 
        $this->assertEquals(
            "Số lượng thành viên (3) vượt quá sức chứa tối đa của phòng (2 người).",
            $response->json('errors.members.0')
        );
    }
}
