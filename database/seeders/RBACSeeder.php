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
        $systemRoles = ['SuperAdmin', 'Admin'];
        foreach ($systemRoles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }
        $this->command->info('✅ System Roles created: ' . implode(', ', $systemRoles));

        // 2. Sync Roles & Permissions from Policies
        $this->command->info('🔄 Syncing permissions from Policies...');
        $stats = $rbacService->sync();

        $this->command->info("✅ Sync complete:");
        $this->command->info("   - Modules scanned: {$stats['modules']}");
        $this->command->info("   - Permissions: {$stats['permissions_created']}");
        $this->command->info("   - Roles synced: {$stats['roles_synced']}");
    }
}
