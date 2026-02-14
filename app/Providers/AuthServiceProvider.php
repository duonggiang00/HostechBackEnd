<?php

namespace App\Providers;

use App\Models\Floor;
use App\Models\Org;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use App\Policies\FloorPolicy;
use App\Policies\OrgPolicy;
use App\Policies\PropertyPolicy;
use App\Policies\RoomPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
        Org::class => OrgPolicy::class,
        Property::class => PropertyPolicy::class,
        Floor::class => FloorPolicy::class,
        Room::class => RoomPolicy::class,
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
