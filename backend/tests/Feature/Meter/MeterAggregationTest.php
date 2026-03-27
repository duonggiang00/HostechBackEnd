<?php

namespace Tests\Feature\Meter;

use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Property\Room;
use App\Models\Property\Property;
use App\Models\Org\Org;
use App\Models\Service\Service;
use App\Services\Meter\MeterReadingService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MeterAggregationTest extends TestCase
{
    use RefreshDatabase;

    protected $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(MeterReadingService::class);
    }

    public function test_master_meter_aggregates_cumulatively()
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

        // Create a service record (required by FK constraint)
        $electricService = Service::factory()->create([
            'org_id' => $org->id,
            'name' => 'Điện',
            'calc_mode' => 'PER_METER',
            'unit' => 'kWh',
        ]);

        // 1. Create Master Meter
        $masterMeter = Meter::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'is_master' => true,
            'base_reading' => 1000,
            'service_id' => $electricService->id,
            'type' => 'ELECTRIC'
        ]);

        // 2. Create Room Meter
        $roomMeter = Meter::factory()->create([
            'room_id' => $room->id,
            'property_id' => $property->id,
            'org_id' => $org->id,
            'is_master' => false,
            'base_reading' => 0,
            'service_id' => $electricService->id,
            'type' => 'ELECTRIC',
        ]);

        // Period 1: Jan — room reads 50 (consumption = 50 - 0 = 50)
        $reading1 = MeterReading::factory()->create([
            'meter_id' => $roomMeter->id,
            'reading_value' => 50,
            'consumption' => 50,
            'status' => 'APPROVED',
            'period_start' => '2024-01-01',
            'period_end' => '2024-01-31',
            'org_id' => $org->id,
        ]);

        $masterReading1 = $this->service->aggregateToMaster($reading1);

        // Master = 1000 (base) + 50 (room consumption) = 1050
        $this->assertNotNull($masterReading1);
        $this->assertEquals(1050, $masterReading1->reading_value);

        // Verify base_reading sync after period 1
        $roomMeter->refresh();
        $masterMeter->refresh();
        $this->assertEquals(50, $roomMeter->base_reading, 'Room meter base_reading should sync to 50 after approval');
        $this->assertEquals(1050, $masterMeter->base_reading, 'Master meter base_reading should equal its latest cumulative reading (1000 + 50)');

        // Period 2: Feb — room reads 120 (consumption = 120 - 50 = 70)
        $reading2 = MeterReading::factory()->create([
            'meter_id' => $roomMeter->id,
            'reading_value' => 120,
            'consumption' => 70,
            'status' => 'APPROVED',
            'period_start' => '2024-02-01',
            'period_end' => '2024-02-28',
            'org_id' => $org->id,
        ]);

        $masterReading2 = $this->service->aggregateToMaster($reading2);

        // Master = 1050 (prev master reading) + 70 (room consumption) = 1120
        $this->assertNotNull($masterReading2);
        $this->assertEquals(1120, $masterReading2->reading_value);
        $this->assertEquals(70, $masterReading2->consumption);

        // Verify base_reading sync after period 2
        $roomMeter->refresh();
        $masterMeter->refresh();
        $this->assertEquals(120, $roomMeter->base_reading, 'Room meter base_reading should sync to 120 after second approval');
        $this->assertEquals(1120, $masterMeter->base_reading, 'Master meter base_reading should match cumulative total (1000 + 120)');
    }
}
