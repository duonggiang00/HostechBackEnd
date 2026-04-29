<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('media:cleanup-temp')->daily();
Schedule::command('contracts:expire')->dailyAt('00:00'); // Tự động xử lý HĐ hết hạn
Schedule::command('app:mark-overdue-invoices')->dailyAt('00:05'); // Tự động chuyển hóa đơn sang OVERDUE
