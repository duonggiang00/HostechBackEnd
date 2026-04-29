<?php

use App\Models\Org\User;
use Database\Seeders\RBACSeeder;
use Illuminate\Support\Facades\Broadcast;

beforeEach(function () {
    $this->seed(RBACSeeder::class);
});

test('App.Models.User channel callback uses strict string id comparison', function () {
    $userA = User::factory()->owner()->create();
    $userB = User::factory()->owner()->create();

    $channels = Broadcast::connection()->getChannels();
    $callback = $channels->get('App.Models.User.{id}');

    expect($callback)->toBeCallable();

    expect($callback($userA, (string) $userB->id))->toBeFalse();
    expect($callback($userA, (string) $userA->id))->toBeTrue();
});
