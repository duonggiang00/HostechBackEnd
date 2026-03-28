<?php

use App\Http\Controllers\Api\Contract\ContractController;
use App\Http\Controllers\Api\Contract\ContractDocumentController;
use App\Http\Controllers\Api\Contract\ContractMemberController;
use Illuminate\Support\Facades\Route;

// Contracts
Route::get('contracts/my-pending', [ContractController::class, 'myPendingContracts']);
Route::post('contracts/{contract}/accept-signature', [ContractController::class, 'acceptSignature']);
Route::post('contracts/{contract}/reject-signature', [ContractController::class, 'rejectSignature']);
Route::get('contracts/{contract}/available-rooms', [ContractController::class, 'availableRooms']);
Route::post('contracts/{contract}/room-transfer-request', [ContractController::class, 'roomTransferRequest']);
Route::post('contracts/{contract}/confirm-payment', [ContractController::class, 'confirmPayment']);
Route::post('contracts/{contract}/terminate', [ContractController::class, 'terminate']);

// Contract Documents
Route::post('contracts/scan', [ContractDocumentController::class, 'scan']);
Route::post('contracts/{contract}/generate-document', [ContractDocumentController::class, 'generate']);
Route::get('contracts/{contract}/document/download', [ContractDocumentController::class, 'download'])->name('api.contracts.document.download');
Route::post('contracts/{contract}/upload-signed', [ContractDocumentController::class, 'uploadSigned']);

Route::get('contracts/trash', [ContractController::class, 'trash']);
Route::apiResource('contracts', ContractController::class);
Route::post('contracts/{id}/restore', [ContractController::class, 'restore']);
Route::delete('contracts/{id}/force', [ContractController::class, 'forceDelete']);

// Contract Members
Route::put('contracts/{contract}/members/{member}/approve', [ContractMemberController::class, 'approve']);
Route::apiResource('contracts.members', ContractMemberController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
