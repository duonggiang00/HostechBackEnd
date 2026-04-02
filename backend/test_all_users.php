<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$users = [
    'nam-thanh_manager_1@example.com',
    'nam-thanh_owner_1@example.com',
    'nam-thanh_staff_1@example.com'
];

$urls = ['/api/properties', '/api/rooms', '/api/contracts'];

foreach ($users as $email) {
    echo "====================================\n";
    echo "Testing user: $email\n";
    echo "====================================\n";
    
    // Login to get token
    $loginRequest = Illuminate\Http\Request::create('/api/auth/login', 'POST', [
        'email' => $email,
        'password' => '12345678'
    ]);
    $loginRequest->headers->set('Accept', 'application/json');
    $loginResponse = $kernel->handle($loginRequest);
    $loginData = json_decode($loginResponse->getContent(), true);
    $kernel->terminate($loginRequest, $loginResponse);
    
    if ($loginResponse->getStatusCode() !== 200) {
         echo "Login failed for $email\n";
         echo $loginResponse->getContent() . "\n";
         continue;
    }
    
    $token = $loginData['token'];

    foreach ($urls as $url) {
        $request = Illuminate\Http\Request::create($url, 'GET');
        $request->headers->set('Accept', 'application/json');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $response = $kernel->handle($request);

        echo "URL: " . $url . "\n";
        echo "Status: " . $response->getStatusCode() . "\n";
        if ($response->getStatusCode() !== 200) {
            $err = json_decode($response->getContent(), true);
            echo "Error Message: " . ($err['message'] ?? $response->getContent()) . "\n";
        } else {
            $data = json_decode($response->getContent(), true);
            $count = isset($data['data']) ? count($data['data']) : 0;
            echo "Success: 200 OK (count: $count)\n";
        }
        echo "--------------------------\n";
        $kernel->terminate($request, $response);
    }
}
