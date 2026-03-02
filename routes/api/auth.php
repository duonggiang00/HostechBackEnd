<?php

use Illuminate\Support\Facades\Route;

/**
 * Đăng xuất
 *
 * Hủy bỏ token hiện tại, đăng xuất khỏi hệ thống.
 *
 * @tags Xác thực (Auth)
 */
Route::post('/auth/logout', function (Illuminate\Http\Request $request) {
    $request->user()?->currentAccessToken()?->delete();
    return response()->json(['message' => 'Logged out successfully'], 200);
});

Route::get('/auth/me', function (Illuminate\Http\Request $request) {
    $user = $request->user()->loadMissing('roles', 'permissions', 'media');
    return new \App\Http\Resources\Org\UserResource($user);
});
