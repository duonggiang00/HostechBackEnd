<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Property\DocumentTemplateRequest;
use App\Models\Document\DocumentTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class DocumentTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $templates = QueryBuilder::for(DocumentTemplate::class)
            ->allowedFilters([
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('format'),
                AllowedFilter::exact('is_active'),
            ])
            ->where('org_id', $request->user()->org_id)
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($templates);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DocumentTemplateRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['org_id'] = $request->user()->org_id;

        if ($request->hasFile('file') && $data['format'] === 'DOCX') {
            $path = $request->file('file')->store('templates/contracts', 'local');
            $data['file_path'] = $path;
        }

        $template = DocumentTemplate::create($data);

        return response()->json([
            'message' => 'Tạo mẫu tài liệu thành công.',
            'data'    => $template
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $template = DocumentTemplate::where('org_id', auth()->user()->org_id)->findOrFail($id);
        return response()->json($template);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DocumentTemplateRequest $request, string $id): JsonResponse
    {
        $template = DocumentTemplate::where('org_id', $request->user()->org_id)->findOrFail($id);
        $data = $request->validated();

        if ($request->hasFile('file') && $data['format'] === 'DOCX') {
            // Delete old file if exists
            if ($template->file_path) {
                Storage::disk('local')->delete($template->file_path);
            }
            $path = $request->file('file')->store('templates/contracts', 'local');
            $data['file_path'] = $path;
        }

        $data['version'] = $template->version + 1;
        $template->update($data);

        return response()->json([
            'message' => 'Cập nhật mẫu tài liệu thành công.',
            'data'    => $template
        ]);
    }

    /**
     * Remove the specified resource from storage (Soft disable).
     */
    public function destroy(string $id): JsonResponse
    {
        $template = DocumentTemplate::where('org_id', auth()->user()->org_id)->findOrFail($id);
        
        $template->update(['is_active' => false]);

        return response()->json([
            'message' => 'Đã vô hiệu hóa mẫu tài liệu.'
        ]);
    }

    /**
     * Get discovery variables from a template.
     */
    public function placeholders(string $id, \App\Services\Contract\ContractDocumentService $service): JsonResponse
    {
        $template = DocumentTemplate::where('org_id', auth()->user()->org_id)->findOrFail($id);
        $vars = $service->placeholderDiscovery($template);

        return response()->json([
            'template_id' => $id,
            'placeholders' => $vars
        ]);
    }
}
