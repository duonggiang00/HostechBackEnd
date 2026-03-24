<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DbQueryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:query {sql}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Execute a raw SQL query and return the result as JSON (for agent visibility)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $sql = $this->argument('sql');
            
            // Basic safety: only allow SELECT by default in this helper
            if (!str_starts_with(strtolower(trim($sql)), 'select') && !str_starts_with(strtolower(trim($sql)), 'show') && !str_starts_with(strtolower(trim($sql)), 'describe')) {
                $this->error('Error: Only SELECT, SHOW, and DESCRIBE queries are allowed via this tool for safety.');
                return 1;
            }

            $results = \DB::select($sql);
            
            $this->line(json_encode($results, JSON_PRETTY_PRINT));
        } catch (\Exception $e) {
            $this->error('Database Error: ' . $e->getMessage());
            return 1;
        }
    }
}
