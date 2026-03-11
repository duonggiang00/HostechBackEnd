<?php
$m = App\Models\Org\User::where('email', 'mai-ltd_manager@example.com')->first();
$pCount = App\Models\Property\Property::whereHas('managers', function($q) use ($m) {
    $q->where('users.id', $m->id);
})->count();
echo "Manager Properties: $pCount\n";

$t = App\Models\Org\User::where('email', 'mai-ltd_tenant_KJC9@example.com')->first();
$rCount = App\Models\Property\Room::whereHas('contracts', function($q) use ($t) {
    $q->where('status', 'ACTIVE')->whereHas('members', function($sq) use ($t) {
        $sq->where('user_id', $t->id);
    });
})->count();
echo "Tenant Rooms: $rCount\n";
