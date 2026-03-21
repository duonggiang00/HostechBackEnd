<?php

namespace App\Http\Resources\Meter;

use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use Illuminate\Http\Request;
use Tests\TestCase;

class VerificationTest extends TestCase
{
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

        // 3. Assertions
        echo "\n--- Verification Results ---\n";
        echo "Meter Code: " . $data['code'] . "\n";
        echo "Latest Reading: " . ($data['latest_reading'] ?? 'NULL') . "\n";
        echo "Last Read At: " . ($data['last_read_at'] ?? 'NULL') . "\n";
        
        if (isset($data['latest_reading']) && $data['latest_reading'] === 1234) {
            echo "SUCCESS: Latest reading found!\n";
        } else {
            echo "FAILED: Latest reading missing or incorrect.\n";
            exit(1);
        }
    }
}
