<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Kernel::class)->handle(Request::capture());
$jobs = DB::table('failed_jobs')->latest('id')->take(2)->get();
foreach ($jobs as $j) {
    echo $j->id."\n".$j->exception."\n\n";
}
