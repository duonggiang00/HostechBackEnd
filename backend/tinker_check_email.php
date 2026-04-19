<?php

$users = \App\Models\Org\User::where('email', 'like', '%duong%')->get();
foreach ($users as $u) {
    echo "User: " . $u->email . " - " . $u->full_name . " - ID: " . $u->id . "\n";
}
