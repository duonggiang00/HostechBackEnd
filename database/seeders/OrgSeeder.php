<?php

namespace Database\Seeders;

use App\Models\Floor;
use App\Models\Org;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrgSeeder extends Seeder
{
    public function run(): void
    {
        Org::factory(3)->create()->each(function (Org $org) {
            // Create users for this org
            User::factory(3)
                ->state(['org_id' => $org->id])
                ->create();

            Property::factory(2)
                ->state(['org_id' => $org->id])
                ->create()
                ->each(function (Property $property) use ($org) {
                    Floor::factory(4)
                        ->state(['org_id' => $org->id, 'property_id' => $property->id])
                        ->create()
                        ->each(function (Floor $floor) use ($org, $property) {
                            Room::factory(5)
                                ->state(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id])
                                ->create();
                        });

                    Room::factory(3)
                        ->state(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => null])
                        ->create();
                });
        });
    }
}

