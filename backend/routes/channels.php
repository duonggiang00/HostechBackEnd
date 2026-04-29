<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Channel authorization for WebSocket connections.
| - property.{propertyId}: Manager/Staff managing a property
| - user.{userId}: Personal notifications (Staff, Tenant)
|
*/

// Kênh tổ chức — sự kiện thanh toán / hóa đơn broadcast tới org.{org_id}
Broadcast::channel('org.{orgId}', function ($user, $orgId) {
    if ($user->hasRole('Admin')) {
        return true;
    }

    return (string) ($user->org_id ?? '') === (string) $orgId;
});

// Channel cho Property — Manager/Staff cùng tòa nhà
Broadcast::channel('property.{propertyId}', function ($user, $propertyId) {
    return $user->properties()->where('properties.id', $propertyId)->exists()
        || $user->hasRole('Admin');
});

// Channel cho User cá nhân — thông báo đích danh
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (string) $user->id === (string) $userId;
});

// Channel mặc định của Laravel Notification (User PK là UUID — so sánh string)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});
// Channel cho User cá nhân (Org Model)
Broadcast::channel('App.Models.Org.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});
