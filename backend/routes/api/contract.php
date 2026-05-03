<?php

use App\Http\Controllers\Api\Contract\ContractController;
use App\Http\Controllers\Api\Contract\ContractDocumentController;
use App\Http\Controllers\Api\Contract\ContractMemberController;
use App\Http\Controllers\Api\Contract\FinalPaymentRequestController;
use Illuminate\Support\Facades\Route;

// Contracts
Route::get('contracts/my-pending', [ContractController::class, 'myPendingContracts']);
Route::get('contracts/my-contracts', [ContractController::class, 'myContracts']);
Route::post('contracts/{contract}/accept-signature', [ContractController::class, 'acceptSignature']);
Route::post('contracts/{contract}/sign', [ContractController::class, 'sign']);
Route::post('contracts/{contract}/reject-signature', [ContractController::class, 'rejectSignature']);
Route::get('contracts/{contract}/available-rooms', [ContractController::class, 'availableRooms']);
Route::post('contracts/{contract}/room-transfer-request', [ContractController::class, 'roomTransferRequest']);
Route::post('contracts/{contract}/request-renewal', [ContractController::class, 'requestRenewal']);
Route::post('contracts/{contract}/approve-renewal', [ContractController::class, 'approveRenewal']);
Route::post('contracts/{contract}/confirm-payment', [ContractController::class, 'confirmPayment']);
Route::get('contracts/{contract}/termination/liquidation-preview', [ContractController::class, 'liquidationPreview']);
Route::get('contracts/{contract}/termination/linked-final-invoice', [ContractController::class, 'terminationLinkedFinalInvoice']);
Route::post('contracts/{contract}/terminate/link-final-invoice', [ContractController::class, 'linkTerminationFinalInvoice']);
Route::get('contracts/{contract}/termination-handover', [ContractController::class, 'terminationHandover']);
Route::post('contracts/{contract}/termination-handover', [ContractController::class, 'commitTerminationHandover']);
Route::post('contracts/{contract}/terminate', [ContractController::class, 'terminate']);
Route::post('contracts/{contract}/terminate/issue-final-invoice', [ContractController::class, 'issueFinalInvoice']);
Route::post('contracts/{contract}/terminate/finalize', [ContractController::class, 'finalizeTermination']);

// Final Payment Requests (kịch bản B: nợ > cọc sau thanh lý)
Route::get('final-payment-requests/{id}', [FinalPaymentRequestController::class, 'show']);
Route::post('final-payment-requests/{id}/payment-url', [FinalPaymentRequestController::class, 'buildPaymentUrl']);
Route::post('final-payment-requests/{id}/record-cash-payment', [FinalPaymentRequestController::class, 'recordCashPayment']);
Route::get('contracts/{contract}/transfer/preview', [ContractController::class, 'previewRoomTransfer']);
Route::post('contracts/{contract}/transfer/issue-final-invoice', [ContractController::class, 'issueRoomTransferFinalInvoice']);
Route::post('contracts/{contract}/execute-transfer', [ContractController::class, 'executeTransfer']);
Route::post('contracts/{contract}/request-termination', [ContractController::class, 'requestTermination']);   // Tenant báo dời đi
Route::get('contracts/{contract}/status-histories', [ContractController::class, 'statusHistories']);           // Timeline lịch sử
Route::get('properties/{propertyId}/pending-requests', [ContractController::class, 'pendingRequests']);         // Manager: hàng chờ yêu cầu cư dân

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
