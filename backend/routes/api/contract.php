<?php

use App\Http\Controllers\Api\Contract\ContractController;
use App\Http\Controllers\Api\Contract\ContractDocumentController;
use App\Http\Controllers\Api\Contract\ContractMemberController;
use Illuminate\Support\Facades\Route;

// Contracts
Route::get('contracts/my-pending', [ContractController::class, 'myPendingContracts']);
Route::get('contracts/my-contracts', [ContractController::class, 'myContracts']);
Route::post('contracts/{contract}/accept-signature', [ContractController::class, 'acceptSignature']);
Route::post('contracts/{contract}/sign', [ContractController::class, 'sign']);
Route::post('contracts/{contract}/manager-sign', [ContractController::class, 'managerConfirmSignature']);
Route::post('contracts/{contract}/reject-signature', [ContractController::class, 'rejectSignature']);
Route::get('contracts/{contract}/available-rooms', [ContractController::class, 'availableRooms']);
Route::post('contracts/{contract}/room-transfer-request', [ContractController::class, 'roomTransferRequest']);
Route::post('contracts/{contract}/confirm-payment', [ContractController::class, 'confirmPayment']);
Route::post('contracts/{contract}/terminate', [ContractController::class, 'terminate']);
Route::post('contracts/{contract}/execute-transfer', [ContractController::class, 'executeTransfer']);
Route::post('contracts/{contract}/request-termination', [ContractController::class, 'requestTermination']);   // Tenant báo dời đi
Route::get('contracts/{contract}/status-histories', [ContractController::class, 'statusHistories']);           // Timeline lịch sử


use App\Http\Controllers\Api\Contract\GeneratedDocumentController;

// Contract Documents
Route::post('contracts/scan', [ContractDocumentController::class, 'scan']);
Route::post('contracts/{contract}/generate-document', [ContractDocumentController::class, 'generate']);
Route::get('contracts/{contract}/document/download', [ContractDocumentController::class, 'download'])->name('api.contracts.document.download');
Route::post('contracts/{contract}/upload-signed', [ContractDocumentController::class, 'uploadSigned']);

// Generated Documents History
Route::get('generated-documents', [GeneratedDocumentController::class, 'index']);
Route::get('generated-documents/{id}/download', [GeneratedDocumentController::class, 'download']);
Route::delete('generated-documents/{id}', [GeneratedDocumentController::class, 'destroy']);

Route::get('contracts/trash', [ContractController::class, 'trash']);
Route::apiResource('contracts', ContractController::class);
Route::post('contracts/{id}/restore', [ContractController::class, 'restore']);
Route::delete('contracts/{id}/force', [ContractController::class, 'forceDelete']);

// Contract Members
Route::put('contracts/{contract}/members/{member}/approve', [ContractMemberController::class, 'approve']);
Route::apiResource('contracts.members', ContractMemberController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
