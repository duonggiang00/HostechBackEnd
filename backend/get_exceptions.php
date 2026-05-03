<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$response = $kernel->handle(
    $request = Request::capture()
);

$jobs = DB::table('failed_jobs')->latest('id')->take(2)->get();
foreach ($jobs as $job) {
    file_put_contents('failed_jobs_exception.txt', $job->exception."\n---\n", FILE_APPEND);
}
echo 'Done';
