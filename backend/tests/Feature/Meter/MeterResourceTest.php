<?php

namespace Tests\Feature\Meter;

use App\Http\Resources\Meter\MeterResource;
use App\Features\Meter\Models\Meter;
use App\Features\Meter\Models\MeterReading;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class MeterResourceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the MeterResource correctly includes the latest reading information.
     */
    public function test_meter_resource_includes_latest_reading()
    {
        // 1. Setup mock meter and reading
        $meter = new Meter([
            'id' => 'test-meter-id',
            'code' => 'M001',
            'type' => 'ELECTRIC',
        ]);

        $latestReading = new MeterReading([
            'reading_value' => 1234,
            'period_end' => now(),
        ]);

        // Mock the relationship
        $meter->setRelation('latestReading', $latestReading);

        // 2. Wrap in Resource
        $resource = new MeterResource($meter);
        $data = $resource->toArray(new Request());

        // 3. Proper PHPUnit Assertions
        $this->assertEquals('M001', $data['code']);
        $this->assertEquals(1234, $data['latest_reading']);
        $this->assertNotNull($data['last_read_at']);
        $this->assertEquals(now()->format('Y-m-d'), $data['last_read_at']);
    }
}
