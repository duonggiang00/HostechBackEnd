<?php

namespace App\Contracts;

interface RbacModuleProvider
{
    /**
     * Get the module name (e.g., 'Room', 'User').
     */
    public static function getModuleName(): string;

    /**
     * Get the role-permission mapping.
     * Format: ['RoleName' => 'CRUD' or ['create', 'view']]
     *
     * @return array<string, string|array>
     */
    public static function getRolePermissions(): array;
}
