<?php

use App\Features\Contract\Controllers\ContractController;
use App\Features\Contract\Controllers\ContractDocumentController;
use App\Features\Contract\Controllers\ContractMemberController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    // Luồng ký xác nhận (Tenant)
    Route::get('contracts/my-pending', [ContractController::class, 'myPendingContracts']);
    Route::post('contracts/{contract}/accept-signature', [ContractController::class, 'acceptSignature']);
    Route::post('contracts/{contract}/reject-signature', [ContractController::class, 'rejectSignature']);

    // Tiện ích đổi phòng (Tenant)
    Route::get('contracts/{contract}/available-rooms', [ContractController::class, 'availableRooms']);
    Route::post('contracts/{contract}/room-transfer-request', [ContractController::class, 'roomTransferRequest']);

    // Quản lý thanh toán & trạng thái (Admin)
    Route::post('contracts/{contract}/confirm-payment', [ContractController::class, 'confirmPayment']);
    Route::post('contracts/{contract}/terminate', [ContractController::class, 'terminate']);

    // Quản lý tài liệu (OCR & Generate)
    Route::post('contracts/scan', [ContractDocumentController::class, 'scan']);
    Route::post('contracts/{contract}/generate-document', [ContractDocumentController::class, 'generate']);
    Route::get('contracts/{contract}/document/download', [ContractDocumentController::class, 'download'])
        ->name('api.contracts.document.download');
    Route::post('contracts/{contract}/upload-signed', [ContractDocumentController::class, 'uploadSigned']);

    // Thùng rác
    Route::get('contracts/trash', [ContractController::class, 'trash']);

    // Resource cơ bản
    Route::apiResource('contracts', ContractController::class);
    Route::post('contracts/{id}/restore', [ContractController::class, 'restore']);
    Route::delete('contracts/{id}/force', [ContractController::class, 'forceDelete']);

    // Thành viên hợp đồng
    Route::put('contracts/{contract}/members/{member}/approve', [ContractMemberController::class, 'approve']);
    Route::apiResource('contracts.members', ContractMemberController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
});
