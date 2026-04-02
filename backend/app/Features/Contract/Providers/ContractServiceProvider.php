<?php

namespace App\Features\Contract\Providers;

use App\Features\Contract\Models\Contract;
use App\Features\Contract\Observers\ContractObserver;
use Illuminate\Support\ServiceProvider;

class ContractServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Contract::observe(ContractObserver::class);
    }
}
