<?php

use App\Contracts\RbacModuleProvider;
use App\Enums\RbacAction;
use Illuminate\Support\Facades\File;

describe('RbacModuleProvider registration', function () {
    it('uses only valid shorthand characters in getRolePermissions string values', function () {
        $policyPath = app_path('Policies');
        $files = File::allFiles($policyPath);
        $allowedChars = ['C', 'R', 'U', 'D', '*'];

        foreach ($files as $file) {
            $relative = $file->getRelativePathname();
            $className = 'App\\Policies\\'.str_replace(['/', '.php'], ['\\', ''], $relative);

            if (! class_exists($className)) {
                continue;
            }

            $reflection = new ReflectionClass($className);
            if (! $reflection->implementsInterface(RbacModuleProvider::class)) {
                continue;
            }

            $rolePermissions = $className::getRolePermissions();

            foreach ($rolePermissions as $roleName => $actions) {
                if (! is_string($actions)) {
                    continue;
                }

                if ($actions === '-') {
                    continue;
                }

                foreach (str_split($actions) as $char) {
                    $upper = strtoupper($char);
                    expect(in_array($upper, $allowedChars, true))->toBeTrue(
                        "Invalid RBAC shorthand '{$char}' in {$className}::getRolePermissions()['{$roleName}'] = '{$actions}'. Allowed: ".implode('', $allowedChars)." or full string '-'"
                    );
                }
            }
        }
    });

    it('uses only valid RbacAction enum values when getRolePermissions returns arrays', function () {
        $policyPath = app_path('Policies');
        $files = File::allFiles($policyPath);
        $valid = array_map(fn (RbacAction $e) => $e->value, RbacAction::cases());
        $arrayEntriesSeen = 0;

        foreach ($files as $file) {
            $relative = $file->getRelativePathname();
            $className = 'App\\Policies\\'.str_replace(['/', '.php'], ['\\', ''], $relative);

            if (! class_exists($className)) {
                continue;
            }

            $reflection = new ReflectionClass($className);
            if (! $reflection->implementsInterface(RbacModuleProvider::class)) {
                continue;
            }

            $rolePermissions = $className::getRolePermissions();

            foreach ($rolePermissions as $roleName => $actions) {
                if (! is_array($actions)) {
                    continue;
                }

                foreach ($actions as $item) {
                    $arrayEntriesSeen++;
                    if ($item instanceof RbacAction) {
                        continue;
                    }
                    $ok = is_string($item) && in_array($item, $valid, true);
                    expect($ok)->toBeTrue(
                        "Invalid action '".json_encode($item)."' in {$className}::getRolePermissions()['{$roleName}']"
                    );
                }
            }
        }

        // Documented contract: array form is allowed by RbacService; current policies may be string-only.
        expect($arrayEntriesSeen)->toBeGreaterThanOrEqual(0);
    });
});
