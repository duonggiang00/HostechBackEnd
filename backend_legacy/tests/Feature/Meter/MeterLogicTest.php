<?php

namespace Tests\Feature\Meter;

use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Service\Service;
use App\Services\Meter\MeterReadingService;
use App\Services\Meter\MeterService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MeterLogicTest extends TestCase
{
    use RefreshDatabase;

    protected Org $org;
    protected Property $property;
    protected Service $service;
    protected MeterService $meterService;
    protected MeterReadingService $readingService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->org = Org::factory()->create();
        $this->property = Property::factory()->create(['org_id' => $this->org->id]);
        $this->service = Service::factory()->create(['org_id' => $this->org->id]);
        
        $this->meterService = app(MeterService::class);
        $this->readingService = app(MeterReadingService::class);
        
        // Act as a manager
        Role::create(['name' => 'Manager']);
        $user = User::factory()->create();
        $user->assignRole('Manager');
        $this->actingAs($user);
        $this->withoutExceptionHandling();
    }

    public function test_meter_aggregation_from_room_to_master()
    {
        // 1. Create a Master Meter
        $masterMeter = Meter::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
            'room_id' => null,
            'service_id' => $this->service->id,
            'type' => 'ELECTRIC',
            'is_master' => true,
            'base_reading' => 1000,
        ]);

        // 2. Create two Rooms with Meters
        $room1 = Room::factory()->create(['org_id' => $this->org->id, 'property_id' => $this->property->id]);
        $meter1 = Meter::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
            'room_id' => $room1->id,
            'service_id' => $this->service->id,
            'type' => 'ELECTRIC',
            'is_master' => false,
            'base_reading' => 0,
        ]);

        $room2 = Room::factory()->create(['org_id' => $this->org->id, 'property_id' => $this->property->id]);
        $meter2 = Meter::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
            'room_id' => $room2->id,
            'service_id' => $this->service->id,
            'type' => 'ELECTRIC',
            'is_master' => false,
            'base_reading' => 100,
        ]);

        // 3. Record and Approve Reading for Room 1 (Usage: 50)
        $reading1 = $this->readingService->create([
            'org_id' => $this->org->id,
            'meter_id' => $meter1->id,
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
            'reading_value' => 50,
        ]);
        $this->readingService->update($reading1, ['status' => 'APPROVED']);

        // Check Master Reading: 1000 (base) + 50 (usage) = 1050
        $this->assertDatabaseHas('meter_readings', [
            'meter_id' => $masterMeter->id,
            'reading_value' => 1050,
        ]);

        // 4. Record and Approve Reading for Room 2 (Usage: 30, Dial 130 - 100 base)
        $reading2 = $this->readingService->create([
            'org_id' => $this->org->id,
            'meter_id' => $meter2->id,
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'reading_value' => 130, 
        ]);
        $this->readingService->update($reading2, ['status' => 'APPROVED']);

        // Check Master Reading: 1000 (base) + 50 (room1) + 30 (room2) = 1080
        $this->assertDatabaseHas('meter_readings', [
            'meter_id' => $masterMeter->id,
            'reading_value' => 1080,
        ]);
    }

    public function test_master_meter_swap_logic()
    {
        // 1. Old Master reaches 5000
        $oldMaster = Meter::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
            'room_id' => null,
            'service_id' => $this->service->id,
            'type' => 'ELECTRIC',
            'is_master' => true,
            'base_reading' => 1000,
        ]);
        
        MeterReading::factory()->create([
            'org_id' => $this->org->id,
            'meter_id' => $oldMaster->id,
            'reading_value' => 5000,
            'status' => 'APPROVED',
        ]);

        // 2. New Master equipment installed (brand new, initial dial 0)
        $newMaster = Meter::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
            'room_id' => null,
            'service_id' => $this->service->id,
            'type' => 'ELECTRIC',
            'is_master' => false,
            'base_reading' => 0,
        ]);

        // 3. Perform Switch
        $this->meterService->switchMasterMeter($oldMaster, $newMaster);

        // 4. Verify result: New Master should have base_reading = 5000
        $newMaster->refresh();
        $oldMaster->refresh();

        $this->assertFalse($oldMaster->is_master);
        $this->assertTrue($newMaster->is_master);
        $this->assertEquals(5000, $newMaster->base_reading);
    }

    public function test_reset_base_readings()
    {
        // 1. Create meters with non-zero base readings
        Meter::factory()->count(3)->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
            'service_id' => $this->service->id,
            'base_reading' => 500,
        ]);

        // 2. Reset
        $count = $this->meterService->resetBaseReadings($this->org->id);
        
        $this->assertEquals(3, $count);
        $this->assertDatabaseMissing('meters', [
            'org_id' => $this->org->id,
            'base_reading' => 500,
        ]);
        $this->assertEquals(0, Meter::where('org_id', $this->org->id)->where('base_reading', '>', 0)->count());
    }

    public function test_delete_room_reading_syncs_master()
    {
        // 1. Setup Master and Room
        $masterMeter = Meter::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
            'is_master' => true,
            'base_reading' => 1000,
            'type' => 'ELECTRIC',
            'service_id' => $this->service->id,
        ]);

        $roomMeter = Meter::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
            'is_master' => false,
            'base_reading' => 0,
            'type' => 'ELECTRIC',
            'service_id' => $this->service->id,
        ]);

        // 2. Create Reading (Usage 100)
        $reading = $this->readingService->create([
            'org_id' => $this->org->id,
            'meter_id' => $roomMeter->id,
            'reading_value' => 100,
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
        ]);
        $this->readingService->update($reading, ['status' => 'APPROVED']);

        // Verify Master has 1100
        $this->assertDatabaseHas('meter_readings', [
            'meter_id' => $masterMeter->id,
            'reading_value' => 1100,
        ]);

        // 3. Delete Room Reading
        $this->readingService->delete($reading);

        // Verify Master Reading REMAINS 1100 (Immutable audit trail)
        $this->assertDatabaseHas('meter_readings', [
            'meter_id' => $masterMeter->id,
            'reading_value' => 1100,
        ]);
    }
}
