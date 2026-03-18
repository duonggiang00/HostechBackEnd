<?php

namespace App\Services;

class TenantManager
{
    protected static ?string $orgId = null;

    protected static ?string $propertyId = null;

    public static function setOrgId(?string $id): void
    {
        static::$orgId = $id;
    }

    public static function getOrgId(): ?string
    {
        return static::$orgId;
    }

    public static function setPropertyId(?string $id): void
    {
        static::$propertyId = $id;
    }

    public static function getPropertyId(): ?string
    {
        return static::$propertyId;
    }
}
