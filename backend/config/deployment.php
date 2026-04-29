<?php

/**
 * Deployment-related env mirrors (read via config(), never env() outside config).
 * Used by `php artisan env:validate`.
 */
return [
    'app_key' => env('APP_KEY'),
    'app_url' => env('APP_URL'),
    'db_connection' => env('DB_CONNECTION'),
    'db_host' => env('DB_HOST'),
    'db_database' => env('DB_DATABASE'),
    'db_username' => env('DB_USERNAME'),
    'queue_connection' => env('QUEUE_CONNECTION'),
    'redis_host' => env('REDIS_HOST'),
    'vnpay_mode' => env('VNPAY_MODE'),
    'vnpay_tmn_code' => env('VNPAY_TMN_CODE'),
    'vnpay_hash_secret' => env('VNPAY_HASH_SECRET'),
];
