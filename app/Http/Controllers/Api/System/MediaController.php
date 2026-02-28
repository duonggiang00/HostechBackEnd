<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Http\Requests\System\UploadRequest;
use App\Models\System\TemporaryUpload;

class MediaController extends Controller
{
    /**
     * Upload file (Temporary)
     */
    public function store(UploadRequest $request)
    {
        $file = $request->file('file');
        $collection = $request->input('collection', 'default');

        // Tạo 1 bản ghi tạm (gắn với user đang đăng nhập nếu có)
        $tempUpload = TemporaryUpload::create([
            'user_id' => $request->user() ? $request->user()->id : null
        ]);

        // Sử dụng MediaLibrary để lưu file
        $media = $tempUpload->addMedia($file)
                             ->toMediaCollection($collection);

        return response()->json([
            'message' => 'File uploaded successfully',
            'data' => [
                'media_id' => $media->uuid,
                'temporary_upload_id' => $tempUpload->id,
                'url' => $media->getUrl(),
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
            ]
        ], 201);
    }
}
