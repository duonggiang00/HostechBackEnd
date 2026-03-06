<?php

namespace App\Services;

class TenantManager
{
    protected static ?string $orgId = null;

    public static function setOrgId(?string $id): void
    {
        static::$orgId = $id;
    }

    public static function getOrgId(): ?string
    {
        return static::$orgId;
    }
}
