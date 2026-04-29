<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Clear Spatie Permission Cache to avoid environmental inconsistencies
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->call([
            RBACSeeder::class,
            OrgSeeder::class,
            TicketSeeder::class,
        ]);
    }
}
