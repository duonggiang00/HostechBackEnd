<?php

namespace Tests\Feature\Meter;

use App\Events\Meter\BulkMeterReadingsApproved;
use App\Events\Meter\MeterReadingApproved;
use App\Listeners\Meter\PerformBatchMasterAggregation;
use App\Listeners\Meter\PerformMasterAggregation;
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
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
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
        
        $this->org      = Org::factory()->create();
        $this->property = Property::factory()->create(['org_id' => $this->org->id]);
        $this->service  = Service::factory()->create(['org_id' => $this->org->id]);
        
        $this->meterService   = app(MeterService::class);
        $this->readingService = app(MeterReadingService::class);
        
        Role::firstOrCreate(['name' => 'Manager']);
        $user = User::factory()->create();
        $user->assignRole('Manager');
        $this->actingAs($user);
        $this->withoutExceptionHandling();

        // Prevent ShouldQueue listeners from auto-running via sync queue.
        // Tests that need aggregation call runAggregation() manually.
        Queue::fake();
    }

    /**
     * Trigger master aggregation synchronously for a single approved reading.
     * Bypasses the queue so tests don't need a running worker.
     */
    private function runAggregation(MeterReading $reading): void
    {
        $listener = app(PerformMasterAggregation::class);
        $listener->handle(new MeterReadingApproved($reading->fresh()));
    }

    public function test_meter_aggregation_from_room_to_master()
    {
        $masterMeter = Meter::factory()->create([
            'org_id'      => $this->org->id,
            'property_id' => $this->property->id,
            'room_id'     => null,
            'service_id'  => $this->service->id,
            'type'        => 'ELECTRIC',
            'is_master'   => true,
            'base_reading' => 1000,
        ]);

        $room1  = Room::factory()->create(['org_id' => $this->org->id, 'property_id' => $this->property->id]);
        $meter1 = Meter::factory()->create([
            'org_id'      => $this->org->id, 'property_id' => $this->property->id,
            'room_id'     => $room1->id, 'service_id' => $this->service->id,
            'type'        => 'ELECTRIC', 'is_master' => false, 'base_reading' => 0,
        ]);

        $room2  = Room::factory()->create(['org_id' => $this->org->id, 'property_id' => $this->property->id]);
        $meter2 = Meter::factory()->create([
            'org_id'      => $this->org->id, 'property_id' => $this->property->id,
            'room_id'     => $room2->id, 'service_id' => $this->service->id,
            'type'        => 'ELECTRIC', 'is_master' => false, 'base_reading' => 100,
        ]);

        // Approve room 1 reading (usage = 50)
        $reading1 = $this->readingService->create([
            'org_id'        => $this->org->id, 'meter_id'     => $meter1->id,
            'period_start'  => now()->startOfMonth(), 'period_end' => now()->endOfMonth(),
            'reading_value' => 50,
        ]);
        $reading1 = $this->readingService->update($reading1, ['status' => 'APPROVED']);
        // Trigger aggregation synchronously (bypasses queue)
        $this->runAggregation($reading1);

        $this->assertDatabaseHas('meter_readings', [
            'meter_id'      => $masterMeter->id,
            'reading_value' => 1050,  // 1000 + 50
        ]);

        // Approve room 2 reading (usage = 30, dial 130 - base 100)
        $reading2 = $this->readingService->create([
            'org_id'        => $this->org->id, 'meter_id'     => $meter2->id,
            'period_start'  => now()->startOfMonth()->toDateString(),
            'period_end'    => now()->endOfMonth()->toDateString(),
            'reading_value' => 130,
        ]);
        $reading2 = $this->readingService->update($reading2, ['status' => 'APPROVED']);
        $this->runAggregation($reading2);

        $this->assertDatabaseHas('meter_readings', [
            'meter_id'      => $masterMeter->id,
            'reading_value' => 1080,  // 1000 + 50 + 30
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
        $masterMeter = Meter::factory()->create([
            'org_id'      => $this->org->id, 'property_id' => $this->property->id,
            'is_master'   => true, 'base_reading' => 1000,
            'type'        => 'ELECTRIC', 'service_id' => $this->service->id,
        ]);
        $roomMeter = Meter::factory()->create([
            'org_id'      => $this->org->id, 'property_id' => $this->property->id,
            'is_master'   => false, 'base_reading' => 0,
            'type'        => 'ELECTRIC', 'service_id' => $this->service->id,
        ]);

        $reading = $this->readingService->create([
            'org_id'        => $this->org->id, 'meter_id'     => $roomMeter->id,
            'reading_value' => 100,
            'period_start'  => now()->startOfMonth(), 'period_end' => now()->endOfMonth(),
        ]);
        $reading = $this->readingService->update($reading, ['status' => 'APPROVED']);
        // Run aggregation synchronously
        $this->runAggregation($reading);

        $this->assertDatabaseHas('meter_readings', [
            'meter_id' => $masterMeter->id, 'reading_value' => 1100,
        ]);

        $this->readingService->delete($reading);

        // Master reading is immutable audit trail — still 1100
        $this->assertDatabaseHas('meter_readings', [
            'meter_id' => $masterMeter->id, 'reading_value' => 1100,
        ]);
    }
}
