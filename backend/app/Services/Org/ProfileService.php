<?php

namespace App\Services\Org;

use App\Models\Org\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

class ProfileService
{
    public function update(User $user, array $data): User
    {
        $user->update($data);

        return $user->refresh();
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        if (! Hash::check($currentPassword, $user->getAuthPassword())) {
            return false;
        }

        $user->password = $newPassword; // Uses setPasswordAttribute mutator

        return $user->save();
    }

    public function uploadAvatar(User $user, UploadedFile $file): string
    {
        // Clear old avatar
        $user->clearMediaCollection('avatar');

        $user->addMedia($file)
            ->usingFileName('avatar_'.$user->id.'.'.$file->extension())
            ->toMediaCollection('avatar');

        return $user->getFirstMediaUrl('avatar');
    }
}
