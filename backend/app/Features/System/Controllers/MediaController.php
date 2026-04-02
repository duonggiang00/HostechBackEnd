<?php

namespace App\Features\System\Controllers;

use App\Http\Controllers\Controller;
use App\Features\System\Requests\UploadRequest;
use App\Features\System\Services\MediaService;
use Dedoc\Scramble\Attributes\Group;

/**
 * Quản lý File (Media)
 */
#[Group('Hệ thống')]
class MediaController extends Controller
{
    public function __construct(protected MediaService $service) {}

    /**
     * Upload file (Temporary)
     */
    public function store(UploadRequest $request): \Illuminate\Http\JsonResponse
    {
        $result = $this->service->uploadTemporary(
            $request->file('file'),
            $request->input('collection', 'default'),
            $request->user()
        );

        return response()->json([
            'message' => 'File uploaded successfully',
            'data' => $result,
        ], 201);
    }
}
