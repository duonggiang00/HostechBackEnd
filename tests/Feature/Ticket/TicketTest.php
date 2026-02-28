<?php

use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Ticket\Ticket;
use App\Models\Ticket\TicketCost;
use App\Models\Ticket\TicketEvent;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Tạo org + user với role chỉ định, kèm property và room thuộc cùng org.
 *
 * @return array{org: Org, user: User, property: Property, room: Room}
 */
function makeOrgWithRole(string $roleName): array
{
    $org = Org::factory()->create();
    $user = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->assignRole($role);

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    return compact('org', 'user', 'property', 'room');
}

/**
 * Tạo 1 ticket thuộc org/property/room của $ctx.
 */
function makeTicket(array $ctx, array $overrides = []): Ticket
{
    return Ticket::factory()->create(array_merge([
        'org_id' => $ctx['org']->id,
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
        'created_by_user_id' => $ctx['user']->id,
    ], $overrides));
}

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
});

// ═══════════════════════════════════════════════════════
// PHẦN 1 — DANH SÁCH (GET /api/tickets)
// ═══════════════════════════════════════════════════════

test('[Owner] có thể xem danh sách tickets của org mình', function () {
    $ctx = makeOrgWithRole('Owner');
    makeTicket($ctx);
    makeTicket($ctx);

    actingAs($ctx['user']);

    getJson('/api/tickets')
        ->assertStatus(200)
        ->assertJsonCount(2, 'data');
});

test('[Owner] không thấy tickets của org khác', function () {
    $ctx1 = makeOrgWithRole('Owner');
    $ctx2 = makeOrgWithRole('Owner');
    makeTicket($ctx1);
    makeTicket($ctx2);

    actingAs($ctx1['user']);

    getJson('/api/tickets')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

test('[Owner] lọc danh sách theo status và priority', function () {
    $ctx = makeOrgWithRole('Owner');
    makeTicket($ctx, ['status' => 'OPEN', 'priority' => 'HIGH']);
    makeTicket($ctx, ['status' => 'DONE', 'priority' => 'LOW']);

    actingAs($ctx['user']);

    getJson('/api/tickets?filter[status]=OPEN')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['status' => 'OPEN']);

    getJson('/api/tickets?filter[priority]=HIGH')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['priority' => 'HIGH']);
});

test('[Tenant] chỉ thấy tickets do mình tạo', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    $other = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'created_by_user_id' => $tenant->id,
    ]);

    Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'created_by_user_id' => $other->id,
    ]);

    actingAs($tenant);

    getJson('/api/tickets')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

test('[Guest] không được xem danh sách', function () {
    getJson('/api/tickets')->assertStatus(401);
});

// ═══════════════════════════════════════════════════════
// PHẦN 2 — TẠO TICKET (POST /api/tickets)
// ═══════════════════════════════════════════════════════

test('[Owner] tạo ticket thành công và sinh event CREATED', function () {
    $ctx = makeOrgWithRole('Owner');

    actingAs($ctx['user']);

    $response = postJson('/api/tickets', [
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
        'category' => 'Điện',
        'priority' => 'HIGH',
        'description' => 'Bóng đèn phòng khách bị hỏng',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.status', 'OPEN')
        ->assertJsonPath('data.priority', 'HIGH')
        ->assertJsonPath('data.category', 'Điện');

    $ticketId = $response->json('data.id');

    assertDatabaseHas('tickets', [
        'id' => $ticketId,
        'org_id' => $ctx['org']->id,
        'description' => 'Bóng đèn phòng khách bị hỏng',
        'status' => 'OPEN',
    ]);

    assertDatabaseHas('ticket_events', [
        'ticket_id' => $ticketId,
        'type' => 'CREATED',
    ]);
});

test('[Owner] tạo ticket tự động gán contract_id nếu phòng có hợp đồng ACTIVE', function () {
    $ctx = makeOrgWithRole('Owner');
    $ownerUser = User::factory()->create(['org_id' => $ctx['org']->id]);

    $contract = Contract::factory()->create([
        'org_id' => $ctx['org']->id,
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
        'status' => 'ACTIVE',
        'created_by_user_id' => $ownerUser->id,
    ]);

    actingAs($ctx['user']);

    $response = postJson('/api/tickets', [
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
        'description' => 'Test contract auto-assign',
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('tickets', [
        'id' => $response->json('data.id'),
        'contract_id' => $contract->id,
    ]);
});

test('[Tenant] tạo ticket thành công', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    actingAs($tenant);

    postJson('/api/tickets', [
        'property_id' => $property->id,
        'room_id' => $room->id,
        'description' => 'Vòi nước bị rỉ',
    ])->assertStatus(201)
        ->assertJsonPath('data.status', 'OPEN');
});

test('tạo ticket thiếu description sẽ thất bại (422)', function () {
    $ctx = makeOrgWithRole('Owner');
    actingAs($ctx['user']);

    postJson('/api/tickets', [
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['description']);
});

// ═══════════════════════════════════════════════════════
// PHẦN 3 — CHI TIẾT TICKET (GET /api/tickets/{id})
// ═══════════════════════════════════════════════════════

test('[Owner] xem chi tiết ticket kèm events và costs', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    TicketEvent::factory()->create([
        'org_id' => $ctx['org']->id,
        'ticket_id' => $ticket->id,
        'actor_user_id' => $ctx['user']->id,
        'type' => 'COMMENT',
        'message' => 'Đã kiểm tra xong',
    ]);

    TicketCost::factory()->create([
        'org_id' => $ctx['org']->id,
        'ticket_id' => $ticket->id,
        'amount' => 150000,
        'created_by_user_id' => $ctx['user']->id,
    ]);

    actingAs($ctx['user']);

    getJson("/api/tickets/{$ticket->id}")
        ->assertStatus(200)
        ->assertJsonPath('data.id', $ticket->id)
        ->assertJsonCount(1, 'data.events')
        ->assertJsonCount(1, 'data.costs')
        ->assertJsonFragment(['message' => 'Đã kiểm tra xong'])
        ->assertJsonFragment(['amount' => 150000.0]);
});

test('[Owner] không xem được ticket của org khác (403)', function () {
    $ctx1 = makeOrgWithRole('Owner');
    $ctx2 = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx2);

    actingAs($ctx1['user']);

    getJson("/api/tickets/{$ticket->id}")->assertStatus(403);
});

test('[Tenant] không xem được ticket của người khác (403)', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    $other = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    $ticket = Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'created_by_user_id' => $other->id,
    ]);

    actingAs($tenant);

    getJson("/api/tickets/{$ticket->id}")->assertStatus(403);
});

// ═══════════════════════════════════════════════════════
// PHẦN 4 — CẬP NHẬT TICKET (PUT /api/tickets/{id})
// ═══════════════════════════════════════════════════════

test('[Owner] cập nhật priority, category, assignee thành công', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx);
    $assignee = User::factory()->create(['org_id' => $ctx['org']->id]);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}", [
        'priority' => 'URGENT',
        'category' => 'Cơ sở vật chất',
        'assigned_to_user_id' => $assignee->id,
    ])->assertStatus(200)
        ->assertJsonPath('data.priority', 'URGENT')
        ->assertJsonPath('data.category', 'Cơ sở vật chất');

    assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'priority' => 'URGENT',
        'assigned_to_user_id' => $assignee->id,
    ]);
});

test('[Staff] được cập nhật ticket (200)', function () {
    $ctx = makeOrgWithRole('Staff');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}", [
        'priority' => 'URGENT',
    ])->assertStatus(200);
});

// ═══════════════════════════════════════════════════════
// PHẦN 5 — ĐỔI TRẠNG THÁI (PUT /api/tickets/{id}/status)
// ═══════════════════════════════════════════════════════

test('[Owner] đổi trạng thái sang IN_PROGRESS và sinh event STATUS_CHANGED', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'OPEN']);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}/status", [
        'status' => 'IN_PROGRESS',
        'message' => 'Đã cử kỹ thuật viên',
    ])->assertStatus(200)
        ->assertJsonPath('data.status', 'IN_PROGRESS');

    assertDatabaseHas('tickets', ['id' => $ticket->id, 'status' => 'IN_PROGRESS']);

    assertDatabaseHas('ticket_events', [
        'ticket_id' => $ticket->id,
        'type' => 'STATUS_CHANGED',
        'message' => 'Đã cử kỹ thuật viên',
    ]);
});

test('[Owner] đổi trạng thái sang DONE tự động điền closed_at', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}/status", [
        'status' => 'DONE',
    ])->assertStatus(200)
        ->assertJsonPath('data.status', 'DONE');

    expect(Ticket::find($ticket->id)->closed_at)->not->toBeNull();
});

test('[Owner] đổi trạng thái sang CANCELLED tự động điền closed_at', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'OPEN']);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}/status", [
        'status' => 'CANCELLED',
        'message' => 'Khách hàng rút yêu cầu',
    ])->assertStatus(200);

    expect(Ticket::find($ticket->id)->closed_at)->not->toBeNull();
});

test('status không hợp lệ sẽ bị từ chối (422)', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}/status", [
        'status' => 'INVALID_STATUS',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

test('[Staff] được đổi trạng thái ticket', function () {
    $ctx = makeOrgWithRole('Staff');
    $ticket = makeTicket($ctx, ['status' => 'RECEIVED']);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}/status", [
        'status' => 'IN_PROGRESS',
    ])->assertStatus(200);
});

// ═══════════════════════════════════════════════════════
// PHẦN 6 — THÊM COMMENT (POST /api/tickets/{id}/events)
// ═══════════════════════════════════════════════════════

test('[Owner] thêm comment vào ticket thành công', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/events", [
        'message' => 'Kỹ thuật viên đang trên đường đến',
    ])->assertStatus(201)
        ->assertJsonPath('data.type', 'COMMENT')
        ->assertJsonPath('data.message', 'Kỹ thuật viên đang trên đường đến');

    assertDatabaseHas('ticket_events', [
        'ticket_id' => $ticket->id,
        'type' => 'COMMENT',
        'message' => 'Kỹ thuật viên đang trên đường đến',
    ]);
});

test('[Tenant] thêm comment vào ticket của chính mình thành công', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    // Tenant tạo ticket qua API để đảm bảo created_by_user_id = $tenant->id
    actingAs($tenant);
    $createResponse = postJson('/api/tickets', [
        'property_id' => $property->id,
        'room_id' => $room->id,
        'description' => 'Vòi nước bị rỉ',
    ]);
    $createResponse->assertStatus(201);
    $ticketId = $createResponse->json('data.id');

    postJson("/api/tickets/{$ticketId}/events", [
        'message' => 'Vui lòng đến sớm nhé!',
    ])->assertStatus(201);
});

test('[Tenant] không được comment vào ticket của người khác (403)', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    $other = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    $ticket = Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'created_by_user_id' => $other->id,
    ]);

    actingAs($tenant);

    postJson("/api/tickets/{$ticket->id}/events", [
        'message' => 'Tin nhắn không được phép',
    ])->assertStatus(403);
});

test('comment rỗng sẽ thất bại (422)', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/events", [
        'message' => '',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['message']);
});

// ═══════════════════════════════════════════════════════
// PHẦN 7 — THÊM CHI PHÍ (POST /api/tickets/{id}/costs)
// ═══════════════════════════════════════════════════════

test('[Owner] thêm chi phí khi ticket IN_PROGRESS thành công', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", [
        'amount' => 150000,
        'payer' => 'TENANT',
        'note' => 'Tiền thay bóng đèn LED',
    ])->assertStatus(201)
        ->assertJsonPath('data.amount', 150000)
        ->assertJsonPath('data.payer', 'TENANT')
        ->assertJsonPath('data.note', 'Tiền thay bóng đèn LED');

    assertDatabaseHas('ticket_costs', [
        'ticket_id' => $ticket->id,
        'amount' => 150000,
        'payer' => 'TENANT',
    ]);
});

test('[Owner] thêm chi phí khi ticket DONE thành công', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'DONE', 'closed_at' => now()]);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", [
        'amount' => 200000,
        'payer' => 'OWNER',
    ])->assertStatus(201);
});

test('[Owner] không thêm được chi phí khi ticket OPEN (422)', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'OPEN']);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", [
        'amount' => 50000,
        'payer' => 'OWNER',
    ])->assertStatus(422);
});

test('[Staff] được thêm chi phí khi có quyền update (201)', function () {
    $ctx = makeOrgWithRole('Staff');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", [
        'amount' => 50000,
        'payer' => 'OWNER',
    ])->assertStatus(201);
});

test('payer không hợp lệ sẽ bị từ chối (422)', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", [
        'amount' => 50000,
        'payer' => 'INVALID',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['payer']);
});

// ═══════════════════════════════════════════════════════
// PHẦN 8 — XÓA TICKET (DELETE /api/tickets/{id})
// ═══════════════════════════════════════════════════════

test('[Owner] xóa ticket thành công', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    deleteJson("/api/tickets/{$ticket->id}")->assertStatus(200);

    assertDatabaseMissing('tickets', ['id' => $ticket->id]);
});

test('[Staff] không được xóa ticket (403)', function () {
    $ctx = makeOrgWithRole('Staff');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    deleteJson("/api/tickets/{$ticket->id}")->assertStatus(403);
});

test('[Owner] không xóa được ticket của org khác (403)', function () {
    $ctx1 = makeOrgWithRole('Owner');
    $ctx2 = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx2);

    actingAs($ctx1['user']);

    deleteJson("/api/tickets/{$ticket->id}")->assertStatus(403);
});

// ═══════════════════════════════════════════════════════
// PHẦN 9 — PHÂN QUYỀN MỜ RỌNG
// ═══════════════════════════════════════════════════════

test('[Manager] CRUD ticket giống Owner', function () {
    $ctx = makeOrgWithRole('Manager');
    actingAs($ctx['user']);

    // Create
    $response = postJson('/api/tickets', [
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
        'description' => 'Manager test ticket',
    ]);
    $response->assertStatus(201);
    $ticketId = $response->json('data.id');

    // Update
    putJson("/api/tickets/{$ticketId}", ['priority' => 'HIGH'])
        ->assertStatus(200)
        ->assertJsonPath('data.priority', 'HIGH');

    // Status change
    putJson("/api/tickets/{$ticketId}/status", ['status' => 'IN_PROGRESS'])
        ->assertStatus(200);

    // Add event
    postJson("/api/tickets/{$ticketId}/events", ['message' => 'Manager comment'])
        ->assertStatus(201);

    // Add cost
    postJson("/api/tickets/{$ticketId}/costs", ['amount' => 100000, 'payer' => 'OWNER'])
        ->assertStatus(201);

    // Delete
    deleteJson("/api/tickets/{$ticketId}")->assertStatus(200);

    assertDatabaseMissing('tickets', ['id' => $ticketId]);
});

test('[Tenant] không được cập nhật ticket (403)', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    $ticket = Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'created_by_user_id' => $tenant->id,
    ]);

    actingAs($tenant);

    putJson("/api/tickets/{$ticket->id}", ['priority' => 'URGENT'])
        ->assertStatus(403);
});

test('[Tenant] không được xóa ticket (403)', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    $ticket = Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'created_by_user_id' => $tenant->id,
    ]);

    actingAs($tenant);

    deleteJson("/api/tickets/{$ticket->id}")->assertStatus(403);
});

test('[Tenant] không được đổi trạng thái ticket (403)', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    $ticket = Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'created_by_user_id' => $tenant->id,
    ]);

    actingAs($tenant);

    putJson("/api/tickets/{$ticket->id}/status", ['status' => 'CANCELLED'])
        ->assertStatus(403);
});

// ═══════════════════════════════════════════════════════
// PHẦN 10 — SECURITY: CROSS-ORG ISOLATION
// ═══════════════════════════════════════════════════════

test('[Owner] tạo ticket với property_id của org khác thất bại (422)', function () {
    $ctx1 = makeOrgWithRole('Owner');
    $ctx2 = makeOrgWithRole('Owner');

    actingAs($ctx1['user']);

    postJson('/api/tickets', [
        'property_id' => $ctx2['property']->id,
        'room_id' => $ctx2['room']->id,
        'description' => 'Cross-org attempt',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['property_id']);
});

test('[Owner] tạo ticket với room_id của org khác thất bại (422)', function () {
    $ctx1 = makeOrgWithRole('Owner');
    $ctx2 = makeOrgWithRole('Owner');

    actingAs($ctx1['user']);

    postJson('/api/tickets', [
        'property_id' => $ctx1['property']->id,
        'room_id' => $ctx2['room']->id,
        'description' => 'Cross-org room attempt',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['room_id']);
});

test('[Owner] gán assigned_to_user_id từ org khác thất bại (422)', function () {
    $ctx1 = makeOrgWithRole('Owner');
    $ctx2 = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx1);

    actingAs($ctx1['user']);

    putJson("/api/tickets/{$ticket->id}", [
        'assigned_to_user_id' => $ctx2['user']->id,
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['assigned_to_user_id']);
});

// ═══════════════════════════════════════════════════════
// PHẦN 11 — EDGE CASES & LOGIC SÂU
// ═══════════════════════════════════════════════════════

test('xem ticket không tồn tại trả về 404', function () {
    $ctx = makeOrgWithRole('Owner');
    actingAs($ctx['user']);

    getJson('/api/tickets/00000000-0000-0000-0000-000000000000')
        ->assertStatus(404);
});

test('[Owner] reopen ticket DONE → OPEN xóa closed_at', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'DONE', 'closed_at' => now()]);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}/status", [
        'status' => 'OPEN',
        'message' => 'Chưa giải quyết xong',
    ])->assertStatus(200)
        ->assertJsonPath('data.status', 'OPEN');

    expect(Ticket::find($ticket->id)->closed_at)->toBeNull();
});

test('[Owner] lọc danh sách theo property_id', function () {
    $org = Org::factory()->create();
    $user = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Owner']);
    $user->assignRole('Owner');

    $prop1 = Property::factory()->create(['org_id' => $org->id]);
    $prop2 = Property::factory()->create(['org_id' => $org->id]);
    $room1 = Room::factory()->create(['org_id' => $org->id, 'property_id' => $prop1->id]);
    $room2 = Room::factory()->create(['org_id' => $org->id, 'property_id' => $prop2->id]);

    Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $prop1->id,
        'room_id' => $room1->id,
        'created_by_user_id' => $user->id,
    ]);
    Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $prop2->id,
        'room_id' => $room2->id,
        'created_by_user_id' => $user->id,
    ]);

    actingAs($user);

    getJson("/api/tickets?filter[property_id]={$prop1->id}")
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.property.id', (string) $prop1->id);
});

test('[Owner] tìm kiếm ticket theo description', function () {
    $ctx = makeOrgWithRole('Owner');
    makeTicket($ctx, ['description' => 'Bóng đèn bị hỏng cần thay gấp']);
    makeTicket($ctx, ['description' => 'Vòi nước rỉ rò nghîm trọng']);

    actingAs($ctx['user']);

    getJson('/api/tickets?search=đèn')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

test('[Owner] thêm chi phí khi ticket WAITING_PARTS thành công', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'WAITING_PARTS']);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", [
        'amount' => 75000,
        'payer' => 'TENANT',
        'note' => 'Đặt linh kiện chờ về',
    ])->assertStatus(201)
        ->assertJsonPath('data.payer', 'TENANT');
});

test('[Owner] thêm chi phí với amount = 0', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", [
        'amount' => 0,
        'payer' => 'OWNER',
    ])->assertStatus(201)
        ->assertJsonPath('data.amount', 0);
});

test('amount âm sẽ bị từ chối (422)', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", [
        'amount' => -500,
        'payer' => 'OWNER',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

test('due_at không hợp lệ khi update sẽ bị từ chối (422)', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}", [
        'due_at' => 'not-a-date',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['due_at']);
});

test('[Owner] đổi trạng thái sang WAITING_PARTS thành công và không set closed_at', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}/status", [
        'status' => 'WAITING_PARTS',
        'message' => 'Đang đặt linh kiện',
    ])->assertStatus(200)
        ->assertJsonPath('data.status', 'WAITING_PARTS');

    expect(Ticket::find($ticket->id)->closed_at)->toBeNull();
});

test('event STATUS_CHANGED chứa meta new_status chính xác', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}/status", [
        'status' => 'RECEIVED',
    ])->assertStatus(200);

    $event = TicketEvent::where('ticket_id', $ticket->id)
        ->where('type', 'STATUS_CHANGED')
        ->first();

    expect($event)->not->toBeNull();
    expect($event->meta['new_status'])->toBe('RECEIVED');
});

test('[Owner] có thể thêm nhiều chi phí vào cùng 1 ticket', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx, ['status' => 'IN_PROGRESS']);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/costs", ['amount' => 100000, 'payer' => 'TENANT'])
        ->assertStatus(201);

    postJson("/api/tickets/{$ticket->id}/costs", ['amount' => 50000, 'payer' => 'OWNER'])
        ->assertStatus(201);

    expect(TicketCost::where('ticket_id', $ticket->id)->count())->toBe(2);

    getJson("/api/tickets/{$ticket->id}")
        ->assertStatus(200)
        ->assertJsonCount(2, 'data.costs');
});

test('[Owner] set due_at khi update ticket', function () {
    $ctx = makeOrgWithRole('Owner');
    $ticket = makeTicket($ctx);

    actingAs($ctx['user']);

    putJson("/api/tickets/{$ticket->id}", [
        'due_at' => '2026-03-15 10:00:00',
    ])->assertStatus(200);

    expect(Ticket::find($ticket->id)->due_at)->not->toBeNull();
});

test('[Owner] tạo ticket không có priority dùng mặc định MEDIUM', function () {
    $ctx = makeOrgWithRole('Owner');
    actingAs($ctx['user']);

    postJson('/api/tickets', [
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
        'description' => 'Test default priority',
    ])->assertStatus(201)
        ->assertJsonPath('data.priority', 'MEDIUM');
});
