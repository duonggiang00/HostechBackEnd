<?php

namespace App\Services;

use App\Contracts\RbacModuleProvider;
use App\Enums\RbacAction;
use Illuminate\Support\Facades\File;
use ReflectionClass;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RbacService
{
    /**
     * Scan all policies and sync permissions to database.
     */
    public function sync(): array
    {
        $stats = [
            'modules' => 0,
            'permissions_created' => 0,
            'roles_synced' => 0,
        ];

        // 1. Clear permission cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Scan Policies
        $policyPath = app_path('Policies');
        if (! File::exists($policyPath)) {
            return $stats;
        }

        $files = File::allFiles($policyPath);

        foreach ($files as $file) {
            $relativePath = $file->getRelativePathname();
            $classPath = str_replace(['/', '.php'], ['\\', ''], $relativePath);
            $className = 'App\\Policies\\' . $classPath;

            if (! class_exists($className)) {
                continue;
            }

            $reflection = new ReflectionClass($className);

            if ($reflection->implementsInterface(RbacModuleProvider::class)) {
                $this->processModule($className, $stats);
            }
        }

        return $stats;
    }

    protected function processModule(string $className, array &$stats): void
    {
        $moduleName = $className::getModuleName();
        $rolePermissions = $className::getRolePermissions();

        $stats['modules']++;

        foreach ($rolePermissions as $roleName => $actions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $permissionsToSync = [];

            // Normalize actions
            if (is_string($actions)) {
                // Handle short-hand "CRUD", "R", "*"
                $actionList = [];
                if ($actions === '*') {
                    $actionList = RbacAction::cases();
                } else {
                    foreach (str_split($actions) as $char) {
                        $actionList = array_merge($actionList, RbacAction::fromShortMap($char));
                    }
                }
            } elseif (is_array($actions)) {
                // Handle array of strings or Enums
                $actionList = array_map(function ($item) {
                    return $item instanceof RbacAction ? $item : RbacAction::tryFrom($item);
                }, $actions);
                $actionList = array_filter($actionList); // Remove nulls
            } else {
                continue;
            }

            // Create and assign permissions
            foreach ($actionList as $actionEnum) {
                $permissionName = $actionEnum->value.' '.$moduleName;

                $permission = Permission::firstOrCreate(['name' => $permissionName]);
                $permissionsToSync[] = $permission;
                $stats['permissions_created']++;
            }

            // Sync permissions to role (merge with existing, don't detach unrelated)
            foreach ($permissionsToSync as $perm) {
                if (! $role->hasPermissionTo($perm)) {
                    $role->givePermissionTo($perm);
                    $stats['roles_synced']++;
                }
            }
        }
    }
}
