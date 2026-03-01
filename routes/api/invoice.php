<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Invoice\InvoiceController;

// Invoices
Route::get('properties/{property_id}/invoices', [InvoiceController::class, 'indexByProperty']);
Route::get('properties/{property_id}/floors/{floor_id}/invoices', [InvoiceController::class, 'indexByFloor']);

// SoftDeletes: Thùng rác, Khôi phục, Xóa vĩnh viễn
Route::get('invoices/trash', [InvoiceController::class, 'trash']);
Route::apiResource('invoices', InvoiceController::class);
Route::post('invoices/{id}/restore', [InvoiceController::class, 'restore']);
Route::delete('invoices/{id}/force', [InvoiceController::class, 'forceDelete']);

// CRUD cho Items trong Hóa đơn
Route::post('invoices/{invoice}/items', [InvoiceController::class, 'storeItem']);
Route::delete('invoices/items/{item}', [InvoiceController::class, 'destroyItem']);
