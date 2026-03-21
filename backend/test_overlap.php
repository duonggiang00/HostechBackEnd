<?php

use App\Models\Property\Room;
use App\Models\Contract\Contract;
use App\Services\Contract\ContractService;
use App\Enums\Contract\ContractStatus;
use Illuminate\Support\Str;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = app(ContractService::class);

try {
    // Find a room and its relations manually to be absolutely sure
    $room = Room::whereHas('property')->first();
    if (!$room) {
        echo "No room with property found. Please seed the database.\n";
        exit(1);
    }
    
    // Refresh to get all fields accurately
    $room = Room::with('property')->findOrFail($room->id);

    echo "Testing with Room ID: {$room->id}, Property ID: {$room->property_id}, Org ID: {$room->org_id}\n";

    // 1. Create a dummy contract
    $contract1 = Contract::create([
        'id' => Str::uuid()->toString(),
        'org_id' => $room->org_id,
        'property_id' => $room->property_id,
        'room_id' => $room->id,
        'start_date' => '2024-01-01',
        'end_date' => '2024-06-30',
        'status' => \App\Enums\ContractStatus::ACTIVE->value,
        'deposit_amount' => 1000000,
        'rent_price' => 5000000,
        'billing_cycle' => 'MONTHLY',
    ]);

    echo "Created Contract 1: 2024-01-01 to 2024-06-30\n";

    // 2. Test overlap (Interior)
    $overlap1 = $service->checkOverlap($room->id, '2024-02-01', '2024-03-01');
    echo "Check overlap (2024-02-01 to 2024-03-01): " . ($overlap1 ? "YES (Correct)" : "NO (ERROR)") . "\n";

    // 3. Test overlap (Boundary start)
    $overlap2 = $service->checkOverlap($room->id, '2023-12-15', '2024-01-05');
    echo "Check overlap (2023-12-15 to 2024-01-05): " . ($overlap2 ? "YES (Correct)" : "NO (ERROR)") . "\n";

    // 4. Test overlap (Boundary end)
    $overlap3 = $service->checkOverlap($room->id, '2024-06-15', '2024-07-15');
    echo "Check overlap (2024-06-15 to 2024-07-15): " . ($overlap3 ? "YES (Correct)" : "NO (ERROR)") . "\n";

    // 5. Test no overlap (Before)
    $overlap4 = $service->checkOverlap($room->id, '2023-01-01', '2023-12-31');
    echo "Check overlap (2023-01-01 to 2023-12-31): " . ($overlap4 ? "YES (ERROR)" : "NO (Correct)") . "\n";

    // 6. Test no overlap (After)
    $overlap5 = $service->checkOverlap($room->id, '2024-07-01', '2024-12-31');
    echo "Check overlap (2024-07-01 to 2024-12-31): " . ($overlap5 ? "YES (ERROR)" : "NO (Correct)") . "\n";

    // 7. Test integration: Try creating an overlapping contract via service
    echo "\nTesting integration via ContractService@create...\n";
    $performer = $room->property->managers()->first()?->user ?? \App\Models\Org\User::first();
    if (!$performer) {
        throw new \Exception("No user found in database.");
    }

    try {
        $service->create([
            'org_id' => $room->org_id,
            'property_id' => $room->property_id,
            'room_id' => $room->id,
            'start_date' => '2024-02-01',
            'end_date' => '2024-03-01',
            'rent_price' => 5000000,
            'deposit_amount' => 1000000,
            'billing_cycle' => 'MONTHLY',
            'due_day' => 1,
        ], $performer);
        echo "ERROR: Should have thrown an exception for overlap!\n";
    } catch (\Exception $e) {
        echo "SUCCESS: Caught expected overlap exception: " . $e->getMessage() . "\n";
    }

    // Clean up
    $contract1->delete();
    echo "Cleanup complete.\n";

} catch (\Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
