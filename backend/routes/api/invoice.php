<?php

use App\Http\Controllers\Api\Invoice\InvoiceController;

use App\Http\Controllers\Api\Invoice\InvoiceAdjustmentController;

use Illuminate\Support\Facades\Route;


// Invoices
Route::get('properties/{property_id}/invoices', [InvoiceController::class, 'indexByProperty']);
Route::get('properties/{property_id}/floors/{floor_id}/invoices', [InvoiceController::class, 'indexByFloor']);

// SoftDeletes: Thùng rác, Khôi phục, Xóa vĩnh viễn
Route::get('invoices/trash', [InvoiceController::class, 'trash']);
Route::apiResource('invoices', InvoiceController::class);
Route::put('invoices/{id}/issue', [InvoiceController::class, 'issue']);
Route::put('invoices/{id}/pay', [InvoiceController::class, 'pay']);
Route::put('invoices/{id}/cancel', [InvoiceController::class, 'cancel']);
Route::post('invoices/{id}/restore', [InvoiceController::class, 'restore']);
Route::delete('invoices/{id}/force', [InvoiceController::class, 'forceDelete']);

// CRUD cho Items trong Hóa đơn
Route::post('invoices/{invoice}/items', [InvoiceController::class, 'storeItem']);
Route::delete('invoices/items/{item}', [InvoiceController::class, 'destroyItem']);

// Lịch sử thay đổi trạng thái hóa đơn
Route::get('invoices/{invoice}/histories', [InvoiceAdjustmentController::class, 'histories']);

// Điều chỉnh hóa đơn (Adjustments)
Route::get('invoices/{invoice}/adjustments', [InvoiceAdjustmentController::class, 'index']);
Route::post('invoices/{invoice}/adjustments', [InvoiceAdjustmentController::class, 'store']);
Route::put('invoices/{invoice}/adjustments/{adjustment}/approve', [InvoiceAdjustmentController::class, 'approve']);
Route::delete('invoices/{invoice}/adjustments/{adjustment}', [InvoiceAdjustmentController::class, 'destroy']);
