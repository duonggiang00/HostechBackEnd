<?php

namespace App\Providers;

use App\Features\Finance\Models\Payment;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Property\Models\Floor;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;
use App\Policies\Finance\FinancePolicy;
use App\Policies\Org\OrgPolicy;
use App\Policies\Org\UserPolicy;
use App\Policies\Property\FloorPolicy;
use App\Policies\Property\PropertyPolicy;
use App\Policies\Property\RoomPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class     => UserPolicy::class,
        Org::class      => OrgPolicy::class,
        Property::class => PropertyPolicy::class,
        Floor::class    => FloorPolicy::class,
        Room::class     => RoomPolicy::class,
        \App\Features\Handover\Models\Handover::class => \App\Policies\Handover\HandoverPolicy::class,
        Payment::class  => FinancePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Policies are registered via the $policies property

        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return $user->hasRole('Admin') ? true : null;
        });
    }
}
