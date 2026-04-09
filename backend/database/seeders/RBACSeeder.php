<?php

namespace Database\Seeders;

use App\Services\RbacService;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RBACSeeder extends Seeder
{
    public function run(RbacService $rbacService): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info("\n📋 Bắt đầu khởi tạo RBAC...");

        // 1. Create System Roles (Not managed by specific module policies)
        $systemRoles = ['Admin'];
        foreach ($systemRoles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }
        $this->command->info('✅ System Roles created: '.implode(', ', $systemRoles));

        // 2. Sync Roles & Permissions from Policies
        $this->command->info('🔄 Syncing permissions from Policies...');
        $stats = $rbacService->sync();

        $this->command->info('✅ Sync complete:');
        $this->command->info("   - Modules scanned: {$stats['modules']}");
        $this->command->info("   - Permissions: {$stats['permissions_created']}");
        $this->command->info("   - Roles synced: {$stats['roles_synced']}");

        // 3. SPECIAL: Grant FULL permissions to Staff role as requested
        $this->command->info("\n🛡️ Granting FULL permissions to Staff role...");
        $staffRole = Role::firstOrCreate(['name' => 'Staff', 'guard_name' => 'web']);
        $allPermissions = \Spatie\Permission\Models\Permission::all();
        $staffRole->syncPermissions($allPermissions);
        $this->command->info('✅ Staff role now has full system permissions.');
    }
}
