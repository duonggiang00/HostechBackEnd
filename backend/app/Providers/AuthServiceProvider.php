<?php

namespace App\Providers;

use App\Features\Finance\Models\Payment;
use App\Features\Finance\Policies\FinancePolicy;
use App\Features\Handover\Models\Handover;
use App\Features\Handover\Policies\HandoverPolicy;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Org\Policies\OrgPolicy;
use App\Features\Org\Policies\UserPolicy;
use App\Features\Property\Models\Floor;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;
use App\Features\Property\Policies\FloorPolicy;
use App\Features\Property\Policies\PropertyPolicy;
use App\Features\Property\Policies\RoomPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class      => UserPolicy::class,
        Org::class       => OrgPolicy::class,
        Property::class  => PropertyPolicy::class,
        Floor::class     => FloorPolicy::class,
        Room::class      => RoomPolicy::class,
        Handover::class  => HandoverPolicy::class,
        Payment::class   => FinancePolicy::class,
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
