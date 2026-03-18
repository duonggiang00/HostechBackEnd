<?php

use App\Http\Controllers\Api\Finance\CashflowController;
use App\Http\Controllers\Api\Finance\LedgerController;
use App\Http\Controllers\Api\Finance\PaymentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Finance Module Routes
|--------------------------------------------------------------------------
|
| Prefix: /api/finance
| Auth: sanctum (inherited from api.php)
|
*/

Route::prefix('finance')->group(function () {

    // ── Payments ──────────────────────────────────────────────
    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('payments', [PaymentController::class, 'store']);
    Route::get('payments/{id}', [PaymentController::class, 'show']);
    Route::delete('payments/{id}', [PaymentController::class, 'destroy']);

    // ── Ledger (Sổ cái đối soát) ──────────────────────────────
    Route::get('ledger', [LedgerController::class, 'index']);
    Route::get('ledger/balance', [LedgerController::class, 'balance']);

    // ── Cashflow (Dòng tiền thực tế In/Out) ───────────────────
    Route::get('cashflow', [CashflowController::class, 'index']);
    Route::post('cashflow', [CashflowController::class, 'store']);
});
