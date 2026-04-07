<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\Org\User::where('email', 'like', '%test_tenant_14%')->orWhere('email', 'like', '%tenant%')->first();
if($user) {
    echo "Found user: {$user->email}\n";
    $contracts = \App\Models\Contract\Contract::whereHas('members', function(\Illuminate\Database\Eloquent\Builder $q) use ($user) {
        $q->where('user_id', $user->id);
    })->with('property:id,name', 'room:id,code,name')->orderBy('created_at', 'desc')->get();
    
    try {
        $resource = \App\Http\Resources\Contract\ContractResource::collection($contracts)->resolve();
        echo json_encode($resource, JSON_PRETTY_PRINT);
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
    }

} else {
    echo "No user found\n";
}
