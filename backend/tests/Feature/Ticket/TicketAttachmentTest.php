<?php

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Ticket\Ticket;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────
// Helpers (cục bộ — không trùng tên với TicketTest.php)
// ─────────────────────────────────────────────

/**
 * Tạo bối cảnh org/user/property/room đầy đủ cho test attachment.
 *
 * @return array{org: Org, user: User, property: Property, room: Room}
 */
function makeAttachmentCtx(string $roleName): array
{
    $org = Org::factory()->create();
    $user = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => $roleName]);
    $user->assignRole($roleName);

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    if (in_array($roleName, ['Manager', 'Staff'])) {
        $property->managers()->syncWithoutDetaching([(string) $user->id]);
    }

    return compact('org', 'user', 'property', 'room');
}

function makeAttachmentTicket(array $ctx, array $overrides = []): Ticket
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
    $this->seed(RBACSeeder::class);
    Storage::fake('public');
    Storage::fake('local');
});

// ═══════════════════════════════════════════════════════
// UPLOAD ATTACHMENTS
// ═══════════════════════════════════════════════════════

test('[Owner] upload nhiều file vào ticket sinh attachments + event ATTACHMENT_ADDED', function () {
    $ctx = makeAttachmentCtx('Owner');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    $response = postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [
            UploadedFile::fake()->image('leak1.jpg'),
            UploadedFile::fake()->image('leak2.png'),
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure([
            'data' => [
                ['id', 'name', 'mime_type', 'size', 'url', 'created_at'],
            ],
        ]);

    expect($ticket->fresh()->getMedia(Ticket::MEDIA_ATTACHMENTS))->toHaveCount(2);

    assertDatabaseHas('ticket_events', [
        'ticket_id' => $ticket->id,
        'type' => 'ATTACHMENT_ADDED',
    ]);
});

test('[Tenant] upload attachment vào ticket của chính mình thành công', function () {
    $ctx = makeAttachmentCtx('Tenant');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->image('mine.jpg')],
    ])->assertStatus(201)
        ->assertJsonCount(1, 'data');
});

test('[Tenant] không upload được attachment vào ticket của người khác (403)', function () {
    $ctx = makeAttachmentCtx('Tenant');
    $other = User::factory()->create(['org_id' => $ctx['org']->id]);

    $ticket = Ticket::factory()->create([
        'org_id' => $ctx['org']->id,
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
        'created_by_user_id' => $other->id,
    ]);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->image('forbidden.jpg')],
    ])->assertStatus(403);
});

test('[Manager] upload được khi quản lý property tương ứng', function () {
    $ctx = makeAttachmentCtx('Manager');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->image('mgr.jpg')],
    ])->assertStatus(201);
});

test('[Manager] không upload được nếu không quản lý property (403)', function () {
    // 2 manager cùng org, mỗi người quản lý 1 property khác nhau.
    $org = Org::factory()->create();
    Role::firstOrCreate(['name' => 'Manager']);

    $managerA = User::factory()->create(['org_id' => $org->id]);
    $managerA->assignRole('Manager');
    $propA = Property::factory()->create(['org_id' => $org->id]);
    $roomA = Room::factory()->create(['org_id' => $org->id, 'property_id' => $propA->id]);
    $propA->managers()->syncWithoutDetaching([(string) $managerA->id]);

    $managerB = User::factory()->create(['org_id' => $org->id]);
    $managerB->assignRole('Manager');
    $propB = Property::factory()->create(['org_id' => $org->id]);
    $roomB = Room::factory()->create(['org_id' => $org->id, 'property_id' => $propB->id]);
    $propB->managers()->syncWithoutDetaching([(string) $managerB->id]);

    // Ticket thuộc property B → Manager A không có quyền.
    $ticket = Ticket::factory()->create([
        'org_id' => $org->id,
        'property_id' => $propB->id,
        'room_id' => $roomB->id,
        'created_by_user_id' => $managerB->id,
    ]);

    actingAs($managerA);

    postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->image('foreign.jpg')],
    ])->assertStatus(403);
});

test('upload mime không hợp lệ bị từ chối (422)', function () {
    $ctx = makeAttachmentCtx('Owner');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->create('script.exe', 100, 'application/x-msdownload')],
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['files.0']);
});

test('upload file quá lớn bị từ chối (422)', function () {
    $ctx = makeAttachmentCtx('Owner');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    // 9 MB > 8 MB limit
    $file = UploadedFile::fake()->create('huge.pdf', 9 * 1024, 'application/pdf');

    postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [$file],
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['files.0']);
});

test('upload không có files trả về 422', function () {
    $ctx = makeAttachmentCtx('Owner');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/attachments", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['files']);
});

// ═══════════════════════════════════════════════════════
// DELETE ATTACHMENTS
// ═══════════════════════════════════════════════════════

test('[Owner] xoá attachment thành công', function () {
    $ctx = makeAttachmentCtx('Owner');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    $upload = postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->image('to-delete.jpg')],
    ])->assertStatus(201);

    $mediaId = $upload->json('data.0.id');

    deleteJson("/api/tickets/{$ticket->id}/attachments/{$mediaId}")
        ->assertStatus(200)
        ->assertJsonPath('message', 'Đã xoá tệp đính kèm.');

    expect($ticket->fresh()->getMedia(Ticket::MEDIA_ATTACHMENTS))->toHaveCount(0);
});

test('[Tenant] xoá attachment trên ticket của chính mình (200)', function () {
    $ctx = makeAttachmentCtx('Tenant');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    $upload = postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->image('mine.jpg')],
    ])->assertStatus(201);

    $mediaId = $upload->json('data.0.id');

    deleteJson("/api/tickets/{$ticket->id}/attachments/{$mediaId}")
        ->assertStatus(200);
});

test('[Tenant] không xoá được attachment trên ticket của người khác (403)', function () {
    $ctx = makeAttachmentCtx('Tenant');
    $owner = User::factory()->create(['org_id' => $ctx['org']->id]);
    Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole('Owner');

    $ticket = Ticket::factory()->create([
        'org_id' => $ctx['org']->id,
        'property_id' => $ctx['property']->id,
        'room_id' => $ctx['room']->id,
        'created_by_user_id' => $owner->id,
    ]);

    // Owner upload trước
    actingAs($owner);
    $upload = postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->image('owner.jpg')],
    ])->assertStatus(201);
    $mediaId = $upload->json('data.0.id');

    // Tenant cố xoá
    actingAs($ctx['user']);
    deleteJson("/api/tickets/{$ticket->id}/attachments/{$mediaId}")
        ->assertStatus(403);
});

test('xoá media id không tồn tại trả về 404', function () {
    $ctx = makeAttachmentCtx('Owner');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    deleteJson("/api/tickets/{$ticket->id}/attachments/999999")
        ->assertStatus(404);
});

// ═══════════════════════════════════════════════════════
// RESOURCE
// ═══════════════════════════════════════════════════════

test('GET /tickets/{id} trả về mảng attachments của ticket', function () {
    $ctx = makeAttachmentCtx('Owner');
    $ticket = makeAttachmentTicket($ctx);

    actingAs($ctx['user']);

    postJson("/api/tickets/{$ticket->id}/attachments", [
        'files' => [UploadedFile::fake()->image('a.jpg')],
    ])->assertStatus(201);

    getJson("/api/tickets/{$ticket->id}")
        ->assertStatus(200)
        ->assertJsonCount(1, 'data.attachments')
        ->assertJsonStructure([
            'data' => [
                'attachments' => [
                    ['id', 'name', 'mime_type', 'size', 'url', 'created_at'],
                ],
            ],
        ]);
});
