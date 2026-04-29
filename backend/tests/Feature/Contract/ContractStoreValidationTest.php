<?php

namespace Tests\Feature\Contract;

use App\Enums\ContractStatus;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\Support\ContractIdentityMedia;
use Tests\TestCase;

class ContractStoreValidationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
        $this->user = User::factory()->create();
        $this->user->assignRole(Role::firstOrCreate(['name' => 'Admin']));
    }

    public function test_it_fails_validation_if_members_exceed_capacity(): void
    {
        Storage::fake('local');

        $org = Org::factory()->create();
        $this->user->update(['org_id' => $org->id]);

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'capacity' => 2,
        ]);

        [$f1, $b1] = ContractIdentityMedia::uuidPairForUser($this->user);
        [$f2, $b2] = ContractIdentityMedia::uuidPairForUser($this->user);
        [$f3, $b3] = ContractIdentityMedia::uuidPairForUser($this->user);

        $this->actingAs($this->user);

        $response = $this->postJson('/api/contracts', [
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE->value,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(6)->toDateString(),
            'rent_price' => 5000000,
            'deposit_amount' => 5000000,
            'billing_cycle' => 1,
            'due_day' => 5,
            'cutoff_day' => 25,
            'members' => [
                [
                    'is_primary' => true,
                    'full_name' => 'Tenant 1',
                    'identity_number' => '111111111',
                    'phone' => '0999111111',
                    'role' => 'TENANT',
                    'date_of_birth' => '1990-01-01',
                    'identity_front_media_id' => $f1,
                    'identity_back_media_id' => $b1,
                ],
                [
                    'is_primary' => false,
                    'full_name' => 'Tenant 2',
                    'identity_number' => '222222222',
                    'phone' => '0888222222',
                    'role' => 'ROOMMATE',
                    'date_of_birth' => '1995-01-01',
                    'identity_front_media_id' => $f2,
                    'identity_back_media_id' => $b2,
                ],
                [
                    'is_primary' => false,
                    'full_name' => 'Tenant 3',
                    'identity_number' => '333333333',
                    'phone' => '0777333333',
                    'role' => 'ROOMMATE',
                    'date_of_birth' => '1996-01-01',
                    'identity_front_media_id' => $f3,
                    'identity_back_media_id' => $b3,
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['members']);

        $this->assertEquals(
            'Số lượng thành viên (3) vượt quá sức chứa tối đa của phòng (2 người).',
            $response->json('errors.members.0')
        );
    }
}
