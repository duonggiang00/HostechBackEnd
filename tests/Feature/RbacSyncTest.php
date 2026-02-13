<?php

namespace Tests\Feature;

use App\Services\RbacService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RbacSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_rbac_service_syncs_permissions_from_policies()
    {
        // 1. Run the sync service
        $service = new RbacService();
        $stats = $service->sync();

        // 2. Assert stats
        $this->assertGreaterThan(0, $stats['modules'], 'Should scan at least one module');
        $this->assertGreaterThan(0, $stats['permissions_created'], 'Should create permissions');

        // 3. Verify specific permissions for Room module (just refactored)
        // RoomPolicy defines 'Owner' => 'CRUD'
        // So 'create Room', 'view Room', 'update Room', 'delete Room' should exist
        $this->assertTrue(Permission::where('name', 'create Room')->exists());
        $this->assertTrue(Permission::where('name', 'view Room')->exists());
        $this->assertTrue(Permission::where('name', 'update Room')->exists());
        $this->assertTrue(Permission::where('name', 'delete Room')->exists());

        // 4. Verify Role assignment
        $ownerRole = Role::where('name', 'Owner')->first();
        $this->assertNotNull($ownerRole);
        $this->assertTrue($ownerRole->hasPermissionTo('create Room'));
        $this->assertTrue($ownerRole->hasPermissionTo('delete Room'));

        // 5. Verify Staff Role
        // RoomPolicy defines 'Staff' => 'RU'
        $staffRole = Role::where('name', 'Staff')->first();
        $this->assertNotNull($staffRole);
        $this->assertTrue($staffRole->hasPermissionTo('view Room'));
        $this->assertTrue($staffRole->hasPermissionTo('update Room'));
        $this->assertFalse($staffRole->hasPermissionTo('delete Room'));
    }

    public function test_rbac_command_runs_successfully()
    {
        $this->artisan('rbac:sync')
            ->expectsOutputToContain('Starting RBAC synchronization...')
            ->expectsOutputToContain('RBAC synchronization completed successfully.')
            ->assertExitCode(0);
    }
}
