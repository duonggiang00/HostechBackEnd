<?php

namespace App\Console\Commands;

use App\Services\RbacService;
use Illuminate\Console\Command;

class RbacSyncCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rbac:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan policies and sync RBAC permissions to database';

    /**
     * Execute the console command.
     */
    public function handle(RbacService $rbacService): void
    {
        $this->info('Starting RBAC synchronization...');

        $stats = $rbacService->sync();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Modules Scanned', $stats['modules']],
                ['Permissions Verified/Created', $stats['permissions_created']],
                ['Roles Synced', $stats['roles_synced']],
            ]
        );

        $this->info('RBAC synchronization completed successfully.');
    }
}
