<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Models\Document\GeneratedDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GeneratedDocumentController extends Controller
{
    /**
     * Display a listing of generated documents for a specific owner.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'owner_type' => 'required|string',
            'owner_id'   => 'required|uuid',
        ]);

        $documents = GeneratedDocument::with('template')
            ->where('owner_type', $request->owner_type)
            ->where('owner_id', $request->owner_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($documents);
    }

    /**
     * Download the generated document file.
     */
    public function download(string $id): StreamedResponse|JsonResponse
    {
        $document = GeneratedDocument::findOrFail($id);

        if (!Storage::disk('local')->exists($document->path)) {
            return response()->json(['message' => 'Không tìm thấy file trên hệ thống.'], 404);
        }

        return Storage::disk('local')->download($document->path, $document->file_name);
    }

    /**
     * Delete a generated document (physical file + record).
     */
    public function destroy(string $id): JsonResponse
    {
        $document = GeneratedDocument::findOrFail($id);

        if (Storage::disk('local')->exists($document->path)) {
            Storage::disk('local')->delete($document->path);
        }

        $document->delete();

        return response()->json(['message' => 'Đã xóa lịch sử tài liệu.']);
    }
}
