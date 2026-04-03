<?php

use App\Features\Invoice\Controllers\InvoiceController;
use App\Features\Invoice\Controllers\InvoiceAdjustmentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    // Luồng quản lý hóa đơn (Admin & Tenant)
    Route::post('invoices/generate-monthly', [InvoiceController::class, 'generateMonthly']);
    Route::post('invoices/property/{property}/generate', [InvoiceController::class, 'generateMonthlyForProperty']);
    
    Route::post('invoices/{invoice}/issue', [InvoiceController::class, 'issue']);
    Route::post('invoices/{invoice}/pay', [InvoiceController::class, 'pay']);
    Route::post('invoices/{invoice}/record-payment', [InvoiceController::class, 'recordPayment']);
    Route::post('invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
    
    Route::get('invoices/trash', [InvoiceController::class, 'trash']);
    Route::post('invoices/{id}/restore', [InvoiceController::class, 'restore']);
    Route::delete('invoices/{id}/force', [InvoiceController::class, 'forceDelete']);

    Route::apiResource('invoices', InvoiceController::class);

    // Chi tiết dòng chi phí
    Route::post('invoices/{invoice}/items', [InvoiceController::class, 'storeItem']);
    Route::delete('invoices/items/{item}', [InvoiceController::class, 'destroyItem']);

    // Điều chỉnh hóa đơn (Adjustments)
    Route::apiResource('invoices.adjustments', InvoiceAdjustmentController::class)->only(['index', 'store', 'destroy']);
});
