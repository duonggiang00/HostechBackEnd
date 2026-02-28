<?php

use App\Http\Controllers\Api\Org\OrgController;
use App\Http\Controllers\Api\Org\UserController;
use App\Http\Controllers\Api\Property\FloorController;
use App\Http\Controllers\Api\Property\PropertyController;
use App\Http\Controllers\Api\Property\RoomController;
use Illuminate\Support\Facades\Route;

// Fortify automatically registers these routes:
// - POST /api/auth/register
// - POST /api/auth/login
// - POST /api/auth/logout (uses auth:web for sessions)

// For API clients using Sanctum tokens, provide a logout endpoint
/**
 * Đăng xuất
 *
 * Hủy bỏ token hiện tại, đăng xuất khỏi hệ thống.
 *
 * @tags Xác thực (Auth)
 */
Route::middleware(['auth:sanctum'])->post('/auth/logout', function (Illuminate\Http\Request $request) {
    // Revoke current Sanctum token
    $request->user()?->currentAccessToken()?->delete();

    return response()->json(['message' => 'Logged out successfully'], 200);
});

Route::middleware(['auth:sanctum'])->get('/auth/me', function (Illuminate\Http\Request $request) {
    return $request->user();
});

// Protected API Routes
use App\Http\Controllers\Api\System\MediaController;

Route::middleware('auth:sanctum')->group(function () {
    // API Quản lý File chung
    Route::post('media/upload', [MediaController::class, 'store']);
    // Organizations
    Route::get('orgs/trash', [OrgController::class, 'trash']);
    Route::apiResource('orgs', OrgController::class);
    Route::post('orgs/{id}/restore', [OrgController::class, 'restore']);
    Route::delete('orgs/{id}/force', [OrgController::class, 'forceDelete']);
    Route::get('orgs/{id}/properties', [OrgController::class, 'properties']);
    Route::get('orgs/{id}/users', [OrgController::class, 'users']);
    Route::get('orgs/{id}/services', [OrgController::class, 'services']);

    // Users
    Route::get('users/trash', [UserController::class, 'trash']);
    Route::apiResource('users', UserController::class);
    Route::post('users/{id}/restore', [UserController::class, 'restore']);
    Route::delete('users/{id}/force', [UserController::class, 'forceDelete']);

    // Properties
    Route::get('properties/trash', [PropertyController::class, 'trash']);
    Route::apiResource('properties', PropertyController::class);
    Route::post('properties/{id}/restore', [PropertyController::class, 'restore']);
    Route::delete('properties/{id}/force', [PropertyController::class, 'forceDelete']);

    // Floors
    Route::get('floors/trash', [FloorController::class, 'trash']);
    Route::apiResource('floors', FloorController::class);
    Route::post('floors/{id}/restore', [FloorController::class, 'restore']);
    Route::delete('floors/{id}/force', [FloorController::class, 'forceDelete']);

    // Rooms
    Route::get('rooms/trash', [RoomController::class, 'trash']);
    Route::apiResource('rooms', RoomController::class);
    Route::post('rooms/{id}/restore', [RoomController::class, 'restore']);
    Route::delete('rooms/{id}/force', [RoomController::class, 'forceDelete']);

    // Room Services
    Route::apiResource('rooms.services', \App\Http\Controllers\Api\Service\RoomServiceController::class);

    // Services
    Route::get('services/trash', [\App\Http\Controllers\Api\Service\ServiceController::class, 'trash']);
    Route::apiResource('services', \App\Http\Controllers\Api\Service\ServiceController::class);
    Route::post('services/{id}/restore', [\App\Http\Controllers\Api\Service\ServiceController::class, 'restore']);
    Route::delete('services/{id}/force', [\App\Http\Controllers\Api\Service\ServiceController::class, 'forceDelete']);

    // Audit Logs
    Route::apiResource('audit-logs', \App\Http\Controllers\Api\System\AuditLogController::class)->only(['index', 'show']);

    // Contracts
    Route::get('contracts/trash', [\App\Http\Controllers\Api\Contract\ContractController::class, 'trash']);
    Route::apiResource('contracts', \App\Http\Controllers\Api\Contract\ContractController::class);
    Route::post('contracts/{id}/restore', [\App\Http\Controllers\Api\Contract\ContractController::class, 'restore']);
    Route::delete('contracts/{id}/force', [\App\Http\Controllers\Api\Contract\ContractController::class, 'forceDelete']);

    // Contract Members
    Route::put('contracts/{contract}/members/{member}/approve', [\App\Http\Controllers\Api\Contract\ContractMemberController::class, 'approve']);
    Route::apiResource('contracts.members', \App\Http\Controllers\Api\Contract\ContractMemberController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

    // Property Module API
    Route::apiResource('properties', \App\Http\Controllers\Api\Property\PropertyController::class);

    // Nested Floors API
    Route::apiResource('properties.floors', \App\Http\Controllers\Api\Property\FloorController::class)
        ->shallow();

    // Nested Rooms API
    Route::apiResource('properties.rooms', \App\Http\Controllers\Api\Property\RoomController::class)
        ->shallow();

    // Nested Room Assets API (under Room)
    Route::apiResource('properties.rooms.assets', \App\Http\Controllers\Api\Property\RoomAssetController::class)
        ->parameters([
            'assets' => 'asset' // parameter name becomes {asset} instead of {room_asset}
        ]);

    // Meters
    Route::get('properties/{property_id}/meters', [\App\Http\Controllers\Api\Meter\MeterController::class, 'indexByProperty']);
    Route::get('properties/{property_id}/floors/{floor_id}/meters', [\App\Http\Controllers\Api\Meter\MeterController::class, 'indexByFloor']);
    Route::apiResource('meters', \App\Http\Controllers\Api\Meter\MeterController::class);

    // Meter Readings
    Route::apiResource('meters.readings', \App\Http\Controllers\Api\Meter\MeterReadingController::class)->scoped();

    // Meter Reading Adjustments
    Route::post('meter-readings/{reading}/adjustments', [\App\Http\Controllers\Api\Meter\AdjustmentNoteController::class, 'store']);
    Route::get('meter-readings/{reading}/adjustments', [\App\Http\Controllers\Api\Meter\AdjustmentNoteController::class, 'index']);
    Route::put('meter-readings/{reading}/adjustments/{adjustment}/approve', [\App\Http\Controllers\Api\Meter\AdjustmentNoteController::class, 'approve']);
    Route::put('meter-readings/{reading}/adjustments/{adjustment}/reject', [\App\Http\Controllers\Api\Meter\AdjustmentNoteController::class, 'reject']);

    // invoices
    // Danh sách theo cây phân cấp Tòa nhà → Tầng
    Route::get('properties/{property_id}/invoices', [\App\Http\Controllers\Api\Invoice\InvoiceController::class, 'indexByProperty']);
    Route::get('properties/{property_id}/floors/{floor_id}/invoices', [\App\Http\Controllers\Api\Invoice\InvoiceController::class, 'indexByFloor']);

    // SoftDeletes: Thùng rác, Khôi phục, Xóa vĩnh viễn
    Route::get('invoices/trash', [\App\Http\Controllers\Api\Invoice\InvoiceController::class, 'trash']);
    Route::apiResource('invoices', \App\Http\Controllers\Api\Invoice\InvoiceController::class);
    Route::post('invoices/{id}/restore', [\App\Http\Controllers\Api\Invoice\InvoiceController::class, 'restore']);
    Route::delete('invoices/{id}/force', [\App\Http\Controllers\Api\Invoice\InvoiceController::class, 'forceDelete']);

    // CRUD cho Items trong Hóa đơn
    Route::post('invoices/{invoice}/items', [\App\Http\Controllers\Api\Invoice\InvoiceController::class, 'storeItem']);
    Route::delete('invoices/items/{item}', [\App\Http\Controllers\Api\Invoice\InvoiceController::class, 'destroyItem']);
    
    // Handovers
    Route::apiResource('handovers', \App\Http\Controllers\Api\Handover\HandoverController::class);
    Route::post('handovers/{handover}/confirm', [\App\Http\Controllers\Api\Handover\HandoverController::class, 'confirm']);
    
    // Handover Items
    Route::get('handovers/{handover}/items', [\App\Http\Controllers\Api\Handover\HandoverController::class, 'itemsIndex']);
    Route::post('handovers/{handover}/items', [\App\Http\Controllers\Api\Handover\HandoverController::class, 'itemsStore']);
    Route::put('handovers/{handover}/items/{item}', [\App\Http\Controllers\Api\Handover\HandoverController::class, 'itemsUpdate']);
    Route::delete('handovers/{handover}/items/{item}', [\App\Http\Controllers\Api\Handover\HandoverController::class, 'itemsDestroy']);
    
    // Handover Meter Snapshots
    Route::get('handovers/{handover}/snapshots', [\App\Http\Controllers\Api\Handover\HandoverController::class, 'snapshotsIndex']);
    Route::post('handovers/{handover}/snapshots', [\App\Http\Controllers\Api\Handover\HandoverController::class, 'snapshotsStore']);
    Route::delete('handovers/{handover}/snapshots/{snapshot}', [\App\Http\Controllers\Api\Handover\HandoverController::class, 'snapshotsDestroy']);
});
