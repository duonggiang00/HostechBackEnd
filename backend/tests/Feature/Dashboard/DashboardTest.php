<?php

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Ticket\Ticket;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    Cache::flush();
    $this->seed(\Database\Seeders\RBACSeeder::class);

    // Shared org
    $this->org = Org::factory()->create();

    // Properties with rooms
    $this->property = Property::factory()->create(['org_id' => $this->org->id]);
    $this->roomOccupied = Room::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'status' => 'occupied',
    ]);
    $this->roomAvailable = Room::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'status' => 'available',
    ]);

    // Users with roles
    $this->admin = User::factory()->admin()->create();
    $this->owner = User::factory()->owner()->create(['org_id' => $this->org->id]);
    $this->manager = User::factory()->manager()->create(['org_id' => $this->org->id]);
    $this->staff = User::factory()->staff()->create(['org_id' => $this->org->id]);
    $this->tenant = User::factory()->tenant()->create(['org_id' => $this->org->id]);

    // Assign manager & staff to property
    DB::table('property_user')->insert([
        ['property_id' => $this->property->id, 'user_id' => $this->manager->id, 'created_at' => now(), 'updated_at' => now()],
        ['property_id' => $this->property->id, 'user_id' => $this->staff->id, 'created_at' => now(), 'updated_at' => now()],
    ]);

    // Active contract
    $this->contract = Contract::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'room_id' => $this->roomOccupied->id,
        'status' => 'ACTIVE',
        'start_date' => now()->subMonths(6),
        'end_date' => now()->addDays(15),
        'signed_at' => now()->subDays(5),
        'rent_price' => 5000000,
        'created_by_user_id' => $this->owner->id,
    ]);

    // Contract member (tenant)
    ContractMember::factory()->create([
        'org_id' => $this->org->id,
        'contract_id' => $this->contract->id,
        'user_id' => $this->tenant->id,
        'role' => 'TENANT',
        'is_primary' => true,
        'joined_at' => now()->subDays(5),
        'left_at' => null,
    ]);

    // Paid invoice this month
    $this->paidInvoice = Invoice::factory()->paid()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'contract_id' => $this->contract->id,
        'room_id' => $this->roomOccupied->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'total_amount' => 6000000,
        'paid_amount' => 6000000,
        'updated_at' => now(),
    ]);

    InvoiceItem::factory()->rent()->create([
        'org_id' => $this->org->id,
        'invoice_id' => $this->paidInvoice->id,
        'amount' => 5000000,
    ]);

    InvoiceItem::factory()->create([
        'org_id' => $this->org->id,
        'invoice_id' => $this->paidInvoice->id,
        'type' => 'SERVICE',
        'amount' => 1000000,
    ]);

    // Overdue invoice (different period to avoid unique constraint)
    Invoice::factory()->overdue()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'contract_id' => $this->contract->id,
        'room_id' => $this->roomOccupied->id,
        'period_start' => now()->subMonth()->startOfMonth(),
        'period_end' => now()->subMonth()->endOfMonth(),
    ]);

    // Tickets
    Ticket::factory()->open()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'room_id' => $this->roomOccupied->id,
        'created_by_user_id' => $this->tenant->id,
    ]);
    Ticket::factory()->open()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'room_id' => $this->roomOccupied->id,
        'created_by_user_id' => $this->tenant->id,
    ]);
    Ticket::factory()->inProgress()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'room_id' => $this->roomOccupied->id,
        'created_by_user_id' => $this->tenant->id,
    ]);
    Ticket::factory()->done()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'room_id' => $this->roomOccupied->id,
        'created_by_user_id' => $this->tenant->id,
    ]);
});

// ──────────────────────────────────────────────────────
//  AUTO-DETECT (GET /api/dashboard)
// ──────────────────────────────────────────────────────

test('unauthenticated user cannot access dashboard', function () {
    getJson('/api/dashboard')->assertUnauthorized();
});

test('tenant cannot access dashboard', function () {
    actingAs($this->tenant)
        ->getJson('/api/dashboard')
        ->assertForbidden();
});

test('auto-detect returns admin dashboard for admin', function () {
    actingAs($this->admin)
        ->getJson('/api/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('role', 'admin')
        ->assertJsonStructure([
            'role',
            'data' => [
                'filter' => ['from', 'to'],
                'organizations' => ['total', 'new_in_range', 'growth_last_6_months'],
                'users' => ['total', 'by_role' => ['owner', 'manager', 'staff', 'tenant']],
                'properties' => ['total_properties', 'total_rooms', 'occupied_rooms', 'available_rooms', 'occupancy_rate'],
            ],
        ]);
});

test('auto-detect returns owner dashboard for owner', function () {
    actingAs($this->owner)
        ->getJson('/api/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('role', 'owner')
        ->assertJsonStructure([
            'role',
            'data' => [
                'filter',
                'revenue' => ['current_period', 'previous_period', 'change_percent'],
                'properties' => ['total_properties', 'total_rooms', 'occupied_rooms', 'available_rooms', 'occupancy_rate', 'list'],
                'staff' => ['managers', 'staff', 'total'],
                'contracts' => ['total_active', 'expiring_in_30_days', 'new_in_range'],
            ],
        ]);
});

test('auto-detect returns manager dashboard for manager', function () {
    actingAs($this->manager)
        ->getJson('/api/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('role', 'manager')
        ->assertJsonStructure([
            'role',
            'data' => [
                'filter',
                'tenants' => ['active', 'new_in_range'],
                'revenue' => ['total', 'rent', 'service'],
                'contracts' => ['total_active', 'expiring_in_30_days', 'overdue'],
                'tickets' => ['pending', 'in_progress', 'done', 'cancelled', 'total', 'by_status'],
            ],
        ]);
});

test('auto-detect returns staff dashboard for staff', function () {
    actingAs($this->staff)
        ->getJson('/api/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('role', 'staff');
});

// ──────────────────────────────────────────────────────
//  ADMIN DASHBOARD (GET /api/dashboard/admin)
// ──────────────────────────────────────────────────────

test('non-admin cannot access admin dashboard', function () {
    actingAs($this->owner)
        ->getJson('/api/dashboard/admin')
        ->assertForbidden();
});

test('admin dashboard shows correct org stats', function () {
    // We have 1 org created in beforeEach
    $response = actingAs($this->admin)
        ->getJson('/api/dashboard/admin')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data['organizations']['total'])->toBeGreaterThanOrEqual(1);
    expect($data['organizations']['growth_last_6_months'])->toHaveCount(6);
});

test('admin dashboard shows correct user role counts', function () {
    $response = actingAs($this->admin)
        ->getJson('/api/dashboard/admin')
        ->assertSuccessful();

    $byRole = $response->json('data.users.by_role');

    expect($byRole['owner'])->toBeGreaterThanOrEqual(1);
    expect($byRole['manager'])->toBeGreaterThanOrEqual(1);
    expect($byRole['staff'])->toBeGreaterThanOrEqual(1);
    expect($byRole['tenant'])->toBeGreaterThanOrEqual(1);
});

test('admin dashboard shows correct property and occupancy stats', function () {
    $response = actingAs($this->admin)
        ->getJson('/api/dashboard/admin')
        ->assertSuccessful();

    $props = $response->json('data.properties');

    expect($props['total_properties'])->toBeGreaterThanOrEqual(1);
    expect($props['total_rooms'])->toBeGreaterThanOrEqual(2);
    expect($props['occupied_rooms'])->toBeGreaterThanOrEqual(1);
    expect($props['available_rooms'])->toBeGreaterThanOrEqual(1);
    expect($props['occupancy_rate'])->toBeGreaterThan(0);
});

// ──────────────────────────────────────────────────────
//  OWNER DASHBOARD (GET /api/dashboard/owner)
// ──────────────────────────────────────────────────────

test('manager cannot access owner dashboard', function () {
    actingAs($this->manager)
        ->getJson('/api/dashboard/owner')
        ->assertForbidden();
});

test('owner dashboard shows revenue with comparison', function () {
    $response = actingAs($this->owner)
        ->getJson('/api/dashboard/owner')
        ->assertSuccessful();

    $revenue = $response->json('data.revenue');

    expect($revenue['current_period'])->toBeGreaterThanOrEqual(6000000);
    expect($revenue)->toHaveKeys(['current_period', 'previous_period', 'change_percent']);
});

test('owner dashboard shows property list with room counts', function () {
    $response = actingAs($this->owner)
        ->getJson('/api/dashboard/owner')
        ->assertSuccessful();

    $props = $response->json('data.properties');

    expect($props['total_properties'])->toBe(1);
    expect($props['total_rooms'])->toBe(2);
    expect($props['occupied_rooms'])->toBe(1);
    expect($props['available_rooms'])->toBe(1);
    expect((float) $props['occupancy_rate'])->toBe(50.0);
    expect($props['list'])->toHaveCount(1);
    expect($props['list'][0])->toHaveKeys(['id', 'code', 'name', 'address', 'rooms_count', 'occupied_rooms_count', 'available_rooms_count']);
});

test('owner dashboard shows staff counts', function () {
    $response = actingAs($this->owner)
        ->getJson('/api/dashboard/owner')
        ->assertSuccessful();

    $staff = $response->json('data.staff');

    expect($staff['managers'])->toBe(1);
    expect($staff['staff'])->toBe(1);
    expect($staff['total'])->toBe(2);
});

test('owner dashboard shows contract stats', function () {
    $response = actingAs($this->owner)
        ->getJson('/api/dashboard/owner')
        ->assertSuccessful();

    $contracts = $response->json('data.contracts');

    expect($contracts['total_active'])->toBe(1);
    expect($contracts['expiring_in_30_days'])->toBe(1); // end_date = now+15 days
    expect($contracts['new_in_range'])->toBe(1); // signed_at = now-5 days
});

test('owner cannot see other org data', function () {
    $otherOrg = Org::factory()->create();
    Property::factory()->create(['org_id' => $otherOrg->id]);
    Room::factory()->create([
        'org_id' => $otherOrg->id,
        'property_id' => Property::withoutGlobalScopes()->where('org_id', $otherOrg->id)->first()->id,
        'status' => 'occupied',
    ]);

    $response = actingAs($this->owner)
        ->getJson('/api/dashboard/owner')
        ->assertSuccessful();

    // Only 1 property (ours), not the other org's
    expect($response->json('data.properties.total_properties'))->toBe(1);
});

// ──────────────────────────────────────────────────────
//  MANAGER/STAFF DASHBOARD (GET /api/dashboard/manager)
// ──────────────────────────────────────────────────────

test('tenant cannot access manager dashboard', function () {
    actingAs($this->tenant)
        ->getJson('/api/dashboard/manager')
        ->assertForbidden();
});

test('manager dashboard shows tenant stats', function () {
    $response = actingAs($this->manager)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful();

    $tenants = $response->json('data.tenants');

    expect($tenants['active'])->toBe(1);
    expect($tenants['new_in_range'])->toBe(1); // joined 5 days ago
});

test('manager dashboard shows revenue breakdown', function () {
    $response = actingAs($this->manager)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful();

    $revenue = $response->json('data.revenue');

    expect($revenue['total'])->toBeGreaterThanOrEqual(6000000);
    expect($revenue['rent'])->toBeGreaterThanOrEqual(5000000);
    expect($revenue['service'])->toBeGreaterThanOrEqual(1000000);
});

test('manager dashboard shows contract stats with overdue', function () {
    $response = actingAs($this->manager)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful();

    $contracts = $response->json('data.contracts');

    expect($contracts['total_active'])->toBe(1);
    expect($contracts['expiring_in_30_days'])->toBe(1);
    expect($contracts['overdue'])->toBe(1); // Has OVERDUE invoice
});

test('manager dashboard shows ticket stats with pending first', function () {
    $response = actingAs($this->manager)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful();

    $tickets = $response->json('data.tickets');

    expect($tickets['pending'])->toBe(2); // 2 OPEN tickets
    expect($tickets['in_progress'])->toBe(1);
    expect($tickets['done'])->toBe(1);
    expect($tickets['total'])->toBe(4);
});

test('manager only sees assigned property data', function () {
    // Create unassigned property with tickets
    $otherProperty = Property::factory()->create(['org_id' => $this->org->id]);
    $otherRoom = Room::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $otherProperty->id,
        'status' => 'occupied',
    ]);
    Ticket::factory()->count(3)->open()->create([
        'org_id' => $this->org->id,
        'property_id' => $otherProperty->id,
        'room_id' => $otherRoom->id,
        'created_by_user_id' => $this->tenant->id,
    ]);

    $response = actingAs($this->manager)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful();

    // Should still only see tickets from assigned property (4 total)
    expect($response->json('data.tickets.total'))->toBe(4);
});

test('staff sees same dashboard structure as manager', function () {
    $response = actingAs($this->staff)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful()
        ->assertJsonStructure([
            'data' => ['tenants', 'revenue', 'contracts', 'tickets'],
        ]);
});

test('manager with no assigned properties sees zeroed stats', function () {
    DB::table('property_user')->where('user_id', $this->manager->id)->delete();

    $response = actingAs($this->manager)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful();

    expect($response->json('data.tenants.active'))->toBe(0);
    expect((float) $response->json('data.revenue.total'))->toBe(0.0);
    expect($response->json('data.contracts.total_active'))->toBe(0);
    expect($response->json('data.tickets.total'))->toBe(0);
});

test('manager ticket mapping includes received and waiting parts', function () {
    Ticket::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'room_id' => $this->roomOccupied->id,
        'status' => 'RECEIVED',
        'created_by_user_id' => $this->tenant->id,
    ]);

    Ticket::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'room_id' => $this->roomOccupied->id,
        'status' => 'WAITING_PARTS',
        'created_by_user_id' => $this->tenant->id,
    ]);

    $response = actingAs($this->manager)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful();

    expect($response->json('data.tickets.pending'))->toBe(3);
    expect($response->json('data.tickets.in_progress'))->toBe(2);
    expect($response->json('data.tickets.total'))->toBe(6);
});

// ──────────────────────────────────────────────────────
//  TIME FILTER
// ──────────────────────────────────────────────────────

test('dashboard accepts from/to filter params', function () {
    $from = now()->subMonth()->startOfMonth()->format('Y-m-d');
    $to = now()->subMonth()->endOfMonth()->format('Y-m-d');

    $response = actingAs($this->admin)
        ->getJson("/api/dashboard?from={$from}&to={$to}")
        ->assertSuccessful();

    expect($response->json('data.filter.from'))->toBe($from);
    expect($response->json('data.filter.to'))->toBe($to);
});

test('time filter affects admin org new_in_range count', function () {
    // Create org 2 months ago
    Org::withoutGlobalScopes()->forceCreate([
        'id' => \Illuminate\Support\Str::uuid(),
        'name' => 'Old Org',
        'phone' => '0901234567',
        'email' => 'old@org.test',
        'created_at' => now()->subMonths(2),
        'updated_at' => now()->subMonths(2),
    ]);

    // Filter for current month only — old org shouldn't count
    $from = now()->startOfMonth()->format('Y-m-d');
    $to = now()->format('Y-m-d');

    $response = actingAs($this->admin)
        ->getJson("/api/dashboard/admin?from={$from}&to={$to}")
        ->assertSuccessful();

    // The Org factory in beforeEach creates org with now() timestamp
    $newInRange = $response->json('data.organizations.new_in_range');
    expect($newInRange)->toBeGreaterThanOrEqual(1);

    // Filter for 2 months ago — should include the old org
    $oldFrom = now()->subMonths(2)->startOfMonth()->format('Y-m-d');
    $oldTo = now()->subMonths(2)->endOfMonth()->format('Y-m-d');

    $response2 = actingAs($this->admin)
        ->getJson("/api/dashboard/admin?from={$oldFrom}&to={$oldTo}")
        ->assertSuccessful();

    expect($response2->json('data.organizations.new_in_range'))->toBeGreaterThanOrEqual(1);
});

test('time filter affects owner revenue calculation', function () {
    // Invoice in current month already exists from beforeEach
    // Filter for last month — should show 0 revenue for current_period
    $from = now()->subMonth()->startOfMonth()->format('Y-m-d');
    $to = now()->subMonth()->endOfMonth()->format('Y-m-d');

    $response = actingAs($this->owner)
        ->getJson("/api/dashboard/owner?from={$from}&to={$to}")
        ->assertSuccessful();

    expect((float) $response->json('data.revenue.current_period'))->toBe(0.0);
});

test('time filter affects manager revenue stats', function () {
    $from = now()->subMonth()->startOfMonth()->format('Y-m-d');
    $to = now()->subMonth()->endOfMonth()->format('Y-m-d');

    $response = actingAs($this->manager)
        ->getJson("/api/dashboard/manager?from={$from}&to={$to}")
        ->assertSuccessful();

    // No paid invoices last month
    expect((float) $response->json('data.revenue.total'))->toBe(0.0);
});

test('invalid date format returns validation error', function () {
    actingAs($this->admin)
        ->getJson('/api/dashboard?from=invalid-date')
        ->assertUnprocessable();
});

test('to before from returns validation error', function () {
    actingAs($this->admin)
        ->getJson('/api/dashboard?from=2026-03-15&to=2026-03-01')
        ->assertUnprocessable();
});

test('filter accepts single day range and includes boundary records', function () {
    $day = now()->format('Y-m-d');

    $response = actingAs($this->owner)
        ->getJson("/api/dashboard/owner?from={$day}&to={$day}")
        ->assertSuccessful();

    expect((float) $response->json('data.revenue.current_period'))->toBe(6000000.0);
});

test('filter with only from uses today as to', function () {
    $from = now()->startOfMonth()->format('Y-m-d');

    $response = actingAs($this->admin)
        ->getJson("/api/dashboard/admin?from={$from}")
        ->assertSuccessful();

    expect($response->json('data.filter.from'))->toBe($from);
    expect($response->json('data.filter.to'))->toBe(now()->format('Y-m-d'));
});

test('filter with only to uses start of month as from', function () {
    $to = now()->format('Y-m-d');

    $response = actingAs($this->admin)
        ->getJson("/api/dashboard/admin?to={$to}")
        ->assertSuccessful();

    expect($response->json('data.filter.from'))->toBe(now()->startOfMonth()->format('Y-m-d'));
    expect($response->json('data.filter.to'))->toBe($to);
});

test('default filter is current month to today', function () {
    $response = actingAs($this->admin)
        ->getJson('/api/dashboard')
        ->assertSuccessful();

    $filter = $response->json('data.filter');

    expect($filter['from'])->toBe(now()->startOfMonth()->format('Y-m-d'));
    expect($filter['to'])->toBe(now()->format('Y-m-d'));
});

// ──────────────────────────────────────────────────────
//  ADMIN ENDPOINT ACCESS CONTROL
// ──────────────────────────────────────────────────────

test('admin can access all role-specific endpoints', function () {
    actingAs($this->admin)
        ->getJson('/api/dashboard/admin')
        ->assertSuccessful();

    actingAs($this->admin)
        ->getJson('/api/dashboard/owner')
        ->assertSuccessful();

    actingAs($this->admin)
        ->getJson('/api/dashboard/manager')
        ->assertSuccessful();
});

test('owner can access owner endpoint but not admin', function () {
    actingAs($this->owner)
        ->getJson('/api/dashboard/owner')
        ->assertSuccessful();

    actingAs($this->owner)
        ->getJson('/api/dashboard/admin')
        ->assertForbidden();
});
