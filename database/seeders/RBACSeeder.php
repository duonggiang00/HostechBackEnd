<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RBACSeeder extends Seeder
{
    protected array $modules = [
        'Users',
        'Orgs',
        'Properties',
        'Floor',
        'Room',
    ];

    protected array $actions = ['create', 'read', 'update', 'delete'];

    protected array $permissionMatrix = [
        'Users' => [
            'Admin' => '*',
            'Owner' => 'CRUD',
            'Manager' => 'R',
            'Staff' => '-',
            'Tenant' => '-',
        ],
        'Orgs' => [
            'Admin' => '*',
            'Owner' => 'RU',
            'Manager' => '-',
            'Staff' => '-',
            'Tenant' => '-',
        ],
        'Properties' => [
            'Admin' => '*',
            'Owner' => 'CRUD',
            'Manager' => 'RU',
            'Staff' => 'R',
            'Tenant' => '-',
        ],
        'Floor' => [
            'Admin' => '*',
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'R',
            'Tenant' => '-',
        ],
        'Room' => [
            'Admin' => '*',
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'RU',
            'Tenant' => 'R',
        ],
    ];

    public function run(): void
    {
        // Reset cached roles and permissions
        app()['cache']->forget('spatie.permission.cache');

        // Create roles
        $roles = [
            'SuperAdmin',  // System-wide admin with no org requirement
            'Admin',       // Org-level admin
            'Owner',
            'Manager',
            'Staff',
            'Tenant',
        ];

        $this->command->info("\n📋 Bắt đầu tạo RBAC (Quản lý vai trò và quyền hạn)...\n");

        foreach ($roles as $role) {
            Role::create(['name' => $role]);
        }

        $this->command->line('✅ Tạo '.count($roles).' vai trò: '.implode(', ', $roles).' (SuperAdmin: Toàn quyền hệ thống)');

        // Create permissions
        $permissionsCount = 0;
        foreach ($this->modules as $module) {
            foreach ($this->actions as $action) {
                Permission::create([
                    'name' => "{$action} {$module}",
                ]);
                $permissionsCount++;
            }
        }

        $this->command->line('✅ Tạo '.$permissionsCount.' quyền hạn (mỗi module có 4 quyền: create, read, update, delete)');

        // Clear cache before assigning permissions
        app()['cache']->forget('spatie.permission.cache');

        // Update permission matrix to include SuperAdmin
        $permissionMatrixWithSuperAdmin = [
            'Users' => [
                'SuperAdmin' => '*',
                'Admin' => '*',
                'Owner' => 'CRUD',
                'Manager' => 'R',
                'Staff' => '-',
                'Tenant' => '-',
            ],
            'Orgs' => [
                'SuperAdmin' => '*',
                'Admin' => '*',
                'Owner' => 'RU',
                'Manager' => '-',
                'Staff' => '-',
                'Tenant' => '-',
            ],
            'Properties' => [
                'SuperAdmin' => '*',
                'Admin' => '*',
                'Owner' => 'CRUD',
                'Manager' => 'RU',
                'Staff' => 'R',
                'Tenant' => '-',
            ],
            'Floor' => [
                'SuperAdmin' => '*',
                'Admin' => '*',
                'Owner' => 'CRUD',
                'Manager' => 'CRUD',
                'Staff' => 'R',
                'Tenant' => '-',
            ],
            'Room' => [
                'SuperAdmin' => '*',
                'Admin' => '*',
                'Owner' => 'CRUD',
                'Manager' => 'CRUD',
                'Staff' => 'RU',
                'Tenant' => 'R',
            ],
        ];

        // Assign permissions to roles
        foreach ($permissionMatrixWithSuperAdmin as $module => $rolesPerms) {
            foreach ($rolesPerms as $roleName => $actions) {
                $role = Role::findByName($roleName);

                if ($actions === '*') {
                    // SuperAdmin and Admin have all permissions for this module
                    foreach ($this->actions as $action) {
                        $permissionName = "{$action} {$module}";
                        $permission = Permission::where('name', $permissionName)->first();
                        if ($permission) {
                            $role->givePermissionTo($permission);
                        }
                    }
                } elseif ($actions !== '-') {
                    // Assign specific permissions
                    $actionArray = str_split($actions);
                    $actionMap = [
                        'C' => 'create',
                        'R' => 'read',
                        'U' => 'update',
                        'D' => 'delete',
                    ];

                    foreach ($actionArray as $action) {
                        if (isset($actionMap[$action])) {
                            $permissionName = "{$actionMap[$action]} {$module}";
                            $permission = Permission::where('name', $permissionName)->first();
                            if ($permission) {
                                $role->givePermissionTo($permission);
                            }
                        }
                    }
                }
            }
        }

        $this->command->line("✅ Gán quyền hạn cho các vai trò hoàn tất\n");
    }
}
