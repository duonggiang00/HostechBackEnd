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

// Channel cho Property — Manager/Staff cùng tòa nhà
Broadcast::channel('property.{propertyId}', function ($user, $propertyId) {
    return $user->properties()->where('properties.id', $propertyId)->exists()
        || $user->hasRole('Admin');
});

// Channel cho User cá nhân — thông báo đích danh
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (string) $user->id === (string) $userId;
});

// Channel mặc định của Laravel Notification
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
