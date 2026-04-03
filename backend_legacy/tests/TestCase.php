<?php

namespace Tests;

use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        // Reset TenantManager static state between tests
        TenantManager::setOrgId(null);
        parent::tearDown();
    }
}
