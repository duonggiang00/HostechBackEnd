<?php

namespace Tests\Feature\Meter;

use App\Events\Meter\BulkMeterReadingsApproved;
use App\Listeners\Meter\PerformBatchMasterAggregation;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Service\Service;
use App\Services\Meter\MeterReadingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class MeterAggregationTest extends TestCase
{
    use RefreshDatabase;

    // ─── Fixtures ────────────────────────────────────────────────────────────

    private Org $org;
    private Property $property;
    private Meter $masterMeter;
    private Meter $roomMeter;
    private MeterReadingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(MeterReadingService::class);

        $this->org      = Org::factory()->create();
        $this->property = Property::factory()->create(['org_id' => $this->org->id]);
        $room           = Room::factory()->create([
            'property_id' => $this->property->id,
            'org_id'      => $this->org->id,
        ]);

        $electricService = Service::factory()->create([
            'org_id'    => $this->org->id,
            'name'      => 'Điện',
            'calc_mode' => 'PER_METER',
            'unit'      => 'kWh',
        ]);

        $this->masterMeter = Meter::factory()->create([
            'property_id' => $this->property->id,
            'org_id'      => $this->org->id,
            'is_master'   => true,
            'base_reading' => 1000,
            'service_id'  => $electricService->id,
            'type'        => 'ELECTRIC',
        ]);

        $this->roomMeter = Meter::factory()->create([
            'room_id'     => $room->id,
            'property_id' => $this->property->id,
            'org_id'      => $this->org->id,
            'is_master'   => false,
            'base_reading' => 0,
            'service_id'  => $electricService->id,
            'type'        => 'ELECTRIC',
        ]);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    /**
     * Dispatch the BulkMeterReadingsApproved event synchronously through the
     * real listener so tests don't depend on a running queue worker.
     */
    private function handleBatchAggregation(array $readingIds): void
    {
        $event    = new BulkMeterReadingsApproved($readingIds);
        $listener = app(PerformBatchMasterAggregation::class);
        $listener->handle($event);
    }

    // ─── Tests ───────────────────────────────────────────────────────────────

    /** @test */
    public function test_batch_listener_aggregates_single_reading_correctly(): void
    {
        // Room reads 50 in January (base = 0), consumption = 50
        $reading = MeterReading::factory()->create([
            'meter_id'     => $this->roomMeter->id,
            'reading_value' => 50,
            'consumption'  => 50,
            'status'       => 'APPROVED',
            'period_start' => '2024-01-01',
            'period_end'   => '2024-01-31',
            'org_id'       => $this->org->id,
        ]);

        $this->handleBatchAggregation([$reading->id]);

        $masterReading = MeterReading::where('meter_id', $this->masterMeter->id)
            ->whereDate('period_end', '2024-01-31')
            ->first();

        // Master should be base (1000) + room consumption (50) = 1050
        $this->assertNotNull($masterReading, 'Master meter reading should be created');
        $this->assertEquals(1050, $masterReading->reading_value);
        $this->assertEquals(50,   $masterReading->consumption);
        $this->assertEquals('APPROVED', $masterReading->status);
    }

    /** @test */
    public function test_batch_listener_aggregates_two_periods_cumulatively(): void
    {
        // Period 1: Jan — consumption 50
        $r1 = MeterReading::factory()->create([
            'meter_id'     => $this->roomMeter->id,
            'reading_value' => 50,
            'consumption'  => 50,
            'status'       => 'APPROVED',
            'period_start' => '2024-01-01',
            'period_end'   => '2024-01-31',
            'org_id'       => $this->org->id,
        ]);
        $this->handleBatchAggregation([$r1->id]);

        // Period 2: Feb — consumption 70
        $r2 = MeterReading::factory()->create([
            'meter_id'     => $this->roomMeter->id,
            'reading_value' => 120,
            'consumption'  => 70,
            'status'       => 'APPROVED',
            'period_start' => '2024-02-01',
            'period_end'   => '2024-02-28',
            'org_id'       => $this->org->id,
        ]);
        $this->handleBatchAggregation([$r2->id]);

        $master2 = MeterReading::where('meter_id', $this->masterMeter->id)
            ->whereDate('period_end', '2024-02-28')
            ->first();

        // 1050 (prev master) + 70 = 1120
        $this->assertEquals(1120, $master2->reading_value);
        $this->assertEquals(70,   $master2->consumption);
    }

    /** @test */
    public function test_batch_listener_handles_multiple_rooms_in_one_batch(): void
    {
        // Add a second room meter to the same property
        $room2 = Room::factory()->create([
            'property_id' => $this->property->id,
            'org_id'      => $this->org->id,
        ]);

        $roomMeter2 = Meter::factory()->create([
            'room_id'     => $room2->id,
            'property_id' => $this->property->id,
            'org_id'      => $this->org->id,
            'is_master'   => false,
            'base_reading' => 0,
            'service_id'  => $this->masterMeter->service_id,
            'type'        => 'ELECTRIC',
        ]);

        // Both rooms read in January
        $r1 = MeterReading::factory()->create([
            'meter_id'     => $this->roomMeter->id,
            'reading_value' => 50,
            'consumption'  => 50,
            'status'       => 'APPROVED',
            'period_start' => '2024-01-01',
            'period_end'   => '2024-01-31',
            'org_id'       => $this->org->id,
        ]);
        $r2 = MeterReading::factory()->create([
            'meter_id'     => $roomMeter2->id,
            'reading_value' => 80,
            'consumption'  => 80,
            'status'       => 'APPROVED',
            'period_start' => '2024-01-01',
            'period_end'   => '2024-01-31',
            'org_id'       => $this->org->id,
        ]);

        // Both IDs in ONE batch event
        $this->handleBatchAggregation([$r1->id, $r2->id]);

        $master = MeterReading::where('meter_id', $this->masterMeter->id)
            ->whereDate('period_end', '2024-01-31')
            ->first();

        // Master = 1000 + (50 + 80) = 1130
        $this->assertNotNull($master, 'Master meter reading should exist');
        $this->assertEquals(1130, $master->reading_value);
        $this->assertEquals(130,  $master->consumption);
    }

    /** @test */
    public function test_batch_listener_skips_master_meter_readings(): void
    {
        // A reading on the master meter itself should be ignored
        $masterReading = MeterReading::factory()->create([
            'meter_id'     => $this->masterMeter->id,
            'reading_value' => 1050,
            'consumption'  => 50,
            'status'       => 'APPROVED',
            'period_start' => '2024-01-01',
            'period_end'   => '2024-01-31',
            'org_id'       => $this->org->id,
        ]);

        $this->handleBatchAggregation([$masterReading->id]);

        // Should not create a NEW master reading (none created by listener)
        $count = MeterReading::where('meter_id', $this->masterMeter->id)->count();
        $this->assertEquals(1, $count, 'Listener should not create additional master readings');
    }

    /** @test */
    public function test_bulk_meter_readings_approved_event_is_fired_on_bulk_store(): void
    {
        Event::fake([BulkMeterReadingsApproved::class]);

        // Simulate Manager creating readings (auto-approved because of role)
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Manager']);
        $manager = \App\Models\Org\User::factory()->create(['org_id' => $this->org->id]);
        $manager->assignRole('Manager');

        $this->actingAs($manager);

        $this->service->bulkStore([
            [
                'meter_id'      => $this->roomMeter->id,
                'reading_value' => 50,
                'period_start'  => '2024-01-01',
                'period_end'    => '2024-01-31',
                'org_id'        => $this->org->id,
                'status'        => 'APPROVED',
            ],
        ]);

        // ONE batch event dispatched, NOT N individual MeterReadingApproved events
        Event::assertDispatched(BulkMeterReadingsApproved::class, 1);
    }
}
