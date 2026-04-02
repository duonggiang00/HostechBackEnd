<?php

namespace Tests\Feature\Meter;

use App\Features\Meter\Models\Meter;
use App\Features\Meter\Models\MeterReading;
use App\Features\Property\Models\Room;
use App\Features\Property\Models\Property;
use App\Features\Org\Models\Org;
use App\Features\Service\Models\Service;
use App\Models\User;
use App\Services\Meter\MeterReadingService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MeterWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(MeterReadingService::class);
    }

    public function test_meter_workflow_staff_submit_manager_approve()
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);
        
        $electricService = Service::factory()->create([
            'org_id' => $org->id,
            'calc_mode' => 'PER_METER',
        ]);

        // 1. Setup Master & Room Meter
        $masterMeter = Meter::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'is_master' => true,
            'base_reading' => 1000,
            'service_id' => $electricService->id,
            'type' => 'ELECTRIC'
        ]);

        $roomMeter = Meter::factory()->create([
            'room_id' => $room->id,
            'property_id' => $property->id,
            'org_id' => $org->id,
            'is_master' => false,
            'base_reading' => 100, // Starting at 100
            'service_id' => $electricService->id,
            'type' => 'ELECTRIC',
        ]);

        // STAFF FLOW: Chốt số (Submitted)
        $readingData = [
            'meter_id' => $roomMeter->id,
            'reading_value' => 150, // Consumption = 150 - 100 = 50
            'status' => 'SUBMITTED',
            'period_start' => '2024-01-01',
            'period_end' => '2024-01-31',
            'org_id' => $org->id,
        ];
        
        $reading = $this->service->create($readingData);
        
        $this->assertEquals('SUBMITTED', $reading->status);
        $this->assertEquals(50, $reading->consumption);
        
        // Verify base_reading NOT changed yet for both
        $roomMeter->refresh();
        $masterMeter->refresh();
        $this->assertEquals(100, $roomMeter->base_reading);
        $this->assertEquals(1000, $masterMeter->base_reading);
        
        // Verify NO master reading yet
        $this->assertEquals(0, MeterReading::where('meter_id', $masterMeter->id)->count());

        // MANAGER FLOW: Approve
        $this->service->update($reading, ['status' => 'APPROVED']);
        
        $reading->refresh();
        $roomMeter->refresh();
        $masterMeter->refresh();
        
        // 2. Verify Room Meter sync
        $this->assertEquals('APPROVED', $reading->status);
        $this->assertEquals(150, $roomMeter->base_reading, 'Room base_reading should sync to latest approved value (150)');
        
        // 3. Verify Master Meter sync & aggregate
        // Master Reading Value = Master Start (1000) + Room Consumption (50) = 1050
        $this->assertEquals(1050, $masterMeter->base_reading, 'Master base_reading should match its latest cumulative reading (1050)');
        
        $masterReading = MeterReading::where('meter_id', $masterMeter->id)->first();
        $this->assertNotNull($masterReading);
        // Master Reading Value = Master Start (1000) + Room Consumption (50) = 1050
        $this->assertEquals(1050, $masterReading->reading_value);
        $this->assertEquals(50, $masterReading->consumption);

        // CORRECTION FLOW: Edit already approved reading
        // Typo fix: actually 160 instead of 150
        $this->service->update($reading, ['reading_value' => 160]);
        
        $reading->refresh();
        $roomMeter->refresh();
        $masterMeter->refresh();
        
        $this->assertEquals(60, $reading->consumption, 'Consumption should recalculate to 60');
        $this->assertEquals(160, $roomMeter->base_reading, 'Room base should update to 160');
        $this->assertEquals(1060, $masterMeter->base_reading, 'Master base should update to 1060');
        
        $masterReading->refresh();
        // Master Reading Value = 1000 + 60 = 1060
        $this->assertEquals(1060, $masterReading->reading_value, 'Master reading should re-aggregate to 1060');
        $this->assertEquals(60, $masterReading->consumption);
    }
}
