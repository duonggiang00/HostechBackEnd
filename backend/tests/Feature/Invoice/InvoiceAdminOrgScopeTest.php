<?php

use App\Models\Org\Org;
use App\Models\Org\User;
use Database\Seeders\RBACSeeder;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RBACSeeder::class);
});

test('admin listing invoices without org context returns 422', function () {
    $admin = User::factory()->admin()->create();
    $admin->syncPermissions(Permission::all());

    actingAs($admin);

    getJson('/api/invoices')->assertStatus(422)
        ->assertJsonFragment(['message' => 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.']);
});

test('admin listing invoices with X-Org-Id returns 200', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->admin()->create();
    $admin->syncPermissions(Permission::all());

    actingAs($admin);

    getJson('/api/invoices', [
        'X-Org-Id' => $org->id,
    ])->assertOk();
});

test('admin listing invoice trash without org context returns 422', function () {
    $admin = User::factory()->admin()->create();
    $admin->syncPermissions(Permission::all());

    actingAs($admin);

    getJson('/api/invoices/trash')->assertStatus(422);
});
