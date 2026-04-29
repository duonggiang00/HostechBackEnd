<?php

use App\Providers\AppServiceProvider;
use App\Providers\AuthServiceProvider;
use App\Providers\FortifyServiceProvider;

return [
    AuthServiceProvider::class,
    AppServiceProvider::class,
    FortifyServiceProvider::class,
];
