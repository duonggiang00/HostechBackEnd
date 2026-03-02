<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Contract\ContractController;
use App\Http\Controllers\Api\Contract\ContractMemberController;

// Contracts
Route::get('contracts/my-pending', [ContractController::class, 'myPendingContracts']);
Route::post('contracts/{contract}/accept-signature', [ContractController::class, 'acceptSignature']);
Route::post('contracts/{contract}/reject-signature', [ContractController::class, 'rejectSignature']);
Route::get('contracts/{contract}/available-rooms', [ContractController::class, 'availableRooms']);
Route::post('contracts/{contract}/room-transfer-request', [ContractController::class, 'roomTransferRequest']);

Route::get('contracts/trash', [ContractController::class, 'trash']);
Route::apiResource('contracts', ContractController::class);
Route::post('contracts/{id}/restore', [ContractController::class, 'restore']);
Route::delete('contracts/{id}/force', [ContractController::class, 'forceDelete']);

// Contract Members
Route::put('contracts/{contract}/members/{member}/approve', [ContractMemberController::class, 'approve']);
Route::apiResource('contracts.members', ContractMemberController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
