<?php
$t = App\Models\Org\User::where('email', 'mai-ltd_tenant_KJC9@example.com')->first();
$contracts = App\Models\Contract\Contract::whereHas('members', function($q) use ($t) {
    $q->where('user_id', $t->id);
})->get();
echo "Contracts for KJC9:\n";
foreach($contracts as $c) {
    echo "ID: {$c->id}, Status: {$c->status}, Room: {$c->room_id}\n";
}
