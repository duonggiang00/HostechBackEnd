<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanupTempUploads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:cleanup-temp';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up temporary uploads older than 24 hours';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoff = now()->subDay();
        
        $uploads = \App\Models\System\TemporaryUpload::where('created_at', '<', $cutoff)->get();
        
        $count = 0;
        foreach ($uploads as $upload) {
            // Cascade delete will delete associated Spatie Media as well due to trait setup
            // Or force clear
            $upload->clearMediaCollection();
            $upload->delete();
            $count++;
        }

        $this->info("Cleaned up {$count} temporary uploads.");
    }
}
