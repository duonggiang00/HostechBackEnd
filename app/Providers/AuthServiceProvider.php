<?php

namespace App\Providers;

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Ticket\Ticket;
use App\Policies\Org\OrgPolicy;
use App\Policies\Org\UserPolicy;
use App\Policies\Property\FloorPolicy;
use App\Policies\Property\PropertyPolicy;
use App\Policies\Property\RoomPolicy;
use App\Policies\Ticket\TicketPolicy;
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
        Ticket::class => TicketPolicy::class,
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
