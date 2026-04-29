<?php

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Database\Seeders\RBACSeeder;
use Illuminate\Support\Facades\Artisan;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RBACSeeder::class);
    Artisan::call('rbac:sync');
});

/**
 * @return array{orgA: Org, orgB: Org, tenantA: User, tenantB: User, contractA: Contract}
 */
function idorTwoOrgContract(): array
{
    $orgA = Org::factory()->create();
    $orgB = Org::factory()->create();

    $propertyA = Property::factory()->create(['org_id' => $orgA->id]);
    $floorA = Floor::factory()->create(['org_id' => $orgA->id, 'property_id' => $propertyA->id]);
    $roomA = Room::factory()->create([
        'org_id' => $orgA->id,
        'property_id' => $propertyA->id,
        'floor_id' => $floorA->id,
    ]);

    $tenantA = User::factory()->create(['org_id' => $orgA->id]);
    $tenantA->assignRole('Tenant');

    $contractA = Contract::factory()->create([
        'org_id' => $orgA->id,
        'property_id' => $propertyA->id,
        'room_id' => $roomA->id,
        'status' => 'ACTIVE',
    ]);

    ContractMember::create([
        'org_id' => $orgA->id,
        'contract_id' => $contractA->id,
        'user_id' => $tenantA->id,
        'full_name' => $tenantA->full_name,
        'status' => 'APPROVED',
        'is_primary' => true,
    ]);

    $tenantB = User::factory()->create(['org_id' => $orgB->id]);
    $tenantB->assignRole('Tenant');

    return [
        'orgA' => $orgA,
        'orgB' => $orgB,
        'tenantA' => $tenantA,
        'tenantB' => $tenantB,
        'contractA' => $contractA,
    ];
}

test('tenant from another org cannot view contract by id', function () {
    $x = idorTwoOrgContract();

    actingAs($x['tenantB']);
    getJson("/api/contracts/{$x['contractA']->id}")
        ->assertNotFound();
});

test('tenant from another org cannot hit app scoped contract style read', function () {
    $x = idorTwoOrgContract();

    actingAs($x['tenantB']);
    getJson("/api/contracts/{$x['contractA']->id}/status-histories")
        ->assertNotFound();
});
