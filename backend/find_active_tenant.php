<?php
$member = App\Models\Contract\ContractMember::with('user')->whereHas('contract', function($q) {
    $q->where('status', 'ACTIVE');
})->where('role', 'TENANT')->first();

if ($member && $member->user) {
    echo $member->user->email . "\n";
} else {
    echo "NO ACTIVE TENANTS FOUND\n";
}
