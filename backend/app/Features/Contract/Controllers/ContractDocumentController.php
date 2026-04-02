<?php

namespace App\Features\Contract\Controllers;

use App\Http\Controllers\Controller;
use App\Features\Contract\Models\Contract;
use App\Features\Contract\Services\ContractDocumentService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Quản lý tài liệu hợp đồng (Scan & Generate)
 */
#[Group('Quản lý Hợp đồng')]
class ContractDocumentController extends Controller
{
    public function __construct(
        protected ContractDocumentService $documentService
    ) {}

    // ───────────────────────────────────────────────────────────────────────────
    //  LUỒNG 1: SCAN → EXTRACT → FILL FORM
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Scan hợp đồng giấy (OCR)
     *
     * Upload ảnh (jpg/png) hoặc PDF scan hợp đồng.
     * API trả về dữ liệu đã trích xuất để pre-fill form tạo hợp đồng.
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf',
                'max:10240', // 10 MB
            ],
        ], [
            'file.required' => 'Vui lòng chọn file ảnh hoặc PDF để scan.',
            'file.mimes'    => 'Chỉ hỗ trợ file ảnh (JPG, PNG, WEBP) hoặc PDF.',
            'file.max'      => 'File không được vượt quá 10MB.',
        ]);

        $extracted = $this->documentService->scanContract($request->file('file'));

        return response()->json([
            'message' => $extracted['_is_mock']
                ? 'OCR chưa được cấu hình. Dữ liệu trả về rỗng.'
                : 'Scan thành công. Vui lòng kiểm tra và xác nhận thông tin trước khi lưu hợp đồng.',
            'data' => $extracted,
        ]);
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  LUỒNG 2: FILL FORM → GENERATE DOC → SAVE
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Tạo file tài liệu hợp đồng (DOCX)
     *
     * Tạo file DOCX từ template hợp đồng với đầy đủ thông tin.
     */
    public function generate(Request $request, string $id): JsonResponse
    {
        $contract = Contract::with(['property', 'room', 'members'])->find($id);

        if (! $contract) {
            abort(404, 'Hợp đồng không tồn tại.');
        }

        $this->authorize('update', $contract);

        $extraData = $request->validate([
            'extra_notes'    => 'nullable|string|max:5000',
            'landlord_name'  => 'nullable|string|max:255',
            'landlord_phone' => 'nullable|string|max:20',
        ]);

        try {
            $storagePath = $this->documentService->generateDocument($contract, array_filter($extraData));

            $contract->update([
                'document_path' => $storagePath,
                'document_type' => 'docx',
            ]);

            return response()->json([
                'message'       => 'Tạo file hợp đồng thành công.',
                'document_path' => $storagePath,
                'download_url'  => route('api.contracts.document.download', $contract->id),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Tải xuống file tài liệu hợp đồng
     *
     * Trả về file DOCX/PDF đã được tạo và lưu trữ.
     */
    public function download(string $id): BinaryFileResponse|JsonResponse
    {
        $contract = Contract::find($id);

        if (! $contract) {
            abort(404, 'Hợp đồng không tồn tại.');
        }

        $this->authorize('view', $contract);

        try {
            $fullPath = $this->documentService->getDocumentFullPath($contract);
            $filename = 'hop-dong-' . ($contract->room?->code ?? $contract->id) . '.' . $contract->document_type;

            return response()->download($fullPath, $filename);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    /**
     * Upload file hợp đồng scan đã ký (lưu vào contract)
     *
     * Sau khi 2 bên ký vào file vật lý, có thể upload bản scan có chữ ký.
     */
    public function uploadSigned(Request $request, string $id): JsonResponse
    {
        $contract = Contract::find($id);

        if (! $contract) {
            abort(404, 'Hợp đồng không tồn tại.');
        }

        $this->authorize('update', $contract);

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:20480', // 20MB
        ], [
            'file.required' => 'Vui lòng chọn file hợp đồng có chữ ký.',
            'file.mimes'    => 'Chỉ hỗ trợ file PDF, JPG, PNG.',
            'file.max'      => 'File không được vượt quá 20MB.',
        ]);

        $media = $contract
            ->addMediaFromRequest('file')
            ->usingFileName('signed-contract-' . now()->timestamp . '.' . $request->file('file')->getClientOriginalExtension())
            ->toMediaCollection('signed_contracts');

        $contract->update([
            'scan_original_filename' => $request->file('file')->getClientOriginalName(),
            'signed_at'              => now(),
        ]);

        return response()->json([
            'message'  => 'Upload hợp đồng có chữ ký thành công.',
            'media_id' => $media->id,
            'url'      => $media->getUrl(),
        ]);
    }
}
