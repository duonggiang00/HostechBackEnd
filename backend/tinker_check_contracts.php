<?php

$user = \App\Models\Org\User::where('email', 'duonggiang00@gmail.com')->first();
if (!$user) {
    echo "User not found\n";
    exit;
}

echo "User ID: " . $user->id . "\n";

$members = \App\Models\Contract\ContractMember::where('user_id', $user->id)->with('contract')->get();

foreach ($members as $m) {
    if ($m->contract) {
        echo "Contract ID: " . $m->contract_id . "\n";
        echo "  Status: " . $m->contract->status . "\n";
        echo "  Path: " . $m->contract->document_path . "\n";
        echo "  Type: " . $m->contract->document_type . "\n";
        echo "  Soft copy exists on disk? " . (file_exists(storage_path('app/' . $m->contract->document_path)) ? 'Yes' : 'No') . "\n";
    }
}
