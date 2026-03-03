<?php

namespace App\Services\System;

use App\Models\System\TemporaryUpload;
use App\Models\Org\User;
use Illuminate\Http\UploadedFile;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaService
{
    /**
     * Handle temporary file upload
     */
    public function uploadTemporary(UploadedFile $file, string $collection = 'default', ?User $user = null): array
    {
        // 1. Create a temporary upload record
        $tempUpload = TemporaryUpload::create([
            'user_id' => $user?->id
        ]);

        // 2. Use Spatie MediaLibrary to store the file
        $media = $tempUpload->addMedia($file)
                             ->toMediaCollection($collection);

        return [
            'media_id' => $media->uuid,
            'temporary_upload_id' => $tempUpload->id,
            'url' => $media->getUrl(),
            'file_name' => $media->file_name,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
        ];
    }
}
