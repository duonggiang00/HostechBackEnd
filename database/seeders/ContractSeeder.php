<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Property\Room;
use App\Models\Org\User;

class ContractSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all rooms
        $rooms = Room::all();

        if ($rooms->isEmpty()) {
            $this->command->warn('No rooms found. Skipping ContractSeeder.');
            return;
        }

        foreach ($rooms as $room) {
            // 70% chance a room has an active contract
            if (rand(0, 100) > 30) {
                $this->createActiveContract($room);
            }

            // 30% chance a room has some history (ended contracts)
            if (rand(0, 100) > 70) {
                $this->createEndedContract($room);
            }
        }
    }

    private function createActiveContract(Room $room)
    {
        $contract = Contract::factory()->create([
            'org_id' => $room->org_id,
            'property_id' => $room->property_id,
            'room_id' => $room->id,
            'status' => 'ACTIVE',
            'start_date' => now()->subMonths(rand(1, 11)),
            'end_date' => now()->addMonths(rand(1, 12)),
        ]);

        // Add 1 primary tenant
        ContractMember::factory()->create([
            'org_id' => $contract->org_id,
            'contract_id' => $contract->id,
            'user_id' => User::factory()->create(['org_id' => $contract->org_id])->id,
            'role' => 'TENANT',
            'is_primary' => true,
        ]);

        // Add optional roommate
        if (rand(0, 1) === 1) {
            ContractMember::factory()->create([
                'org_id' => $contract->org_id,
                'contract_id' => $contract->id,
                'user_id' => User::factory()->create(['org_id' => $contract->org_id])->id,
                'role' => 'ROOMMATE',
                'is_primary' => false,
            ]);
        }
    }

    private function createEndedContract(Room $room)
    {
        $contract = Contract::factory()->create([
            'org_id' => $room->org_id,
            'property_id' => $room->property_id,
            'room_id' => $room->id,
            'status' => 'ENDED',
            'start_date' => now()->subYears(2),
            'end_date' => now()->subYears(1),
            'terminated_at' => now()->subYears(1),
        ]);

        // Add past tenant
        ContractMember::factory()->create([
            'org_id' => $contract->org_id,
            'contract_id' => $contract->id,
            'user_id' => User::factory()->create(['org_id' => $contract->org_id])->id,
            'role' => 'TENANT',
            'is_primary' => true,
            'left_at' => $contract->end_date,
        ]);
    }
}
