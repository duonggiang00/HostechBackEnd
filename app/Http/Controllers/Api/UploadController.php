<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Org\User;

class UploadController extends Controller
{
    /**
     * Upload ảnh tạm thời (Unattached)
     */
    public function store(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'], // Max 5MB
        ]);

        /** @var User $user */
        $user = auth()->user();

        // Gắn media vào chính User đang upload nhưng đưa vào collection 'temp'
        $media = $user->addMediaFromRequest('image')
            ->toMediaCollection('temp');

        return response()->json([
            'id' => $media->id,
            'url' => $media->getUrl(),
            'thumb_url' => $media->getUrl('thumb'),
        ]);
    }
}
