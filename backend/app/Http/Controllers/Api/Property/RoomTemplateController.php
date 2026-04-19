<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RoomTemplateStoreRequest;
use App\Http\Requests\Property\RoomTemplateUpdateRequest;
use App\Http\Resources\Property\RoomTemplateResource;
use App\Models\Property\RoomTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoomTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, $propertyId = null): \Illuminate\Http\Resources\Json\AnonymousResourceCollection|\Illuminate\Http\JsonResponse
    {
        // Support both nested route /properties/{property}/room-templates
        // and flat URL /room-templates?filter[property_id]=...
        $id = $propertyId ?: $request->input('filter.property_id') ?: $request->input('property_id');

        if (!$id) {
            return response()->json([
                'message' => 'The property_id is required.'
            ], 422);
        }

        $templates = RoomTemplate::where('property_id', $id)
            ->with(['services', 'assets'])
            ->with('media') // Eager load Spatie media
            ->get();

        return RoomTemplateResource::collection($templates);
    }

    public function store(RoomTemplateStoreRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();

            // Extract media_ids before creating template
            $mediaIds = $data['media_ids'] ?? [];
            unset($data['media_ids']);

            $template = RoomTemplate::create(array_merge($data, [
                'org_id' => $request->user()->org_id ?? $request->user()->id
            ]));

            if ($request->has('services')) {
                $template->services()->sync($request->services);
            }

            if ($request->has('assets')) {
                foreach ($request->assets as $asset) {
                    $template->assets()->create([
                        'name' => $asset['name'],
                        'condition' => $asset['condition'] ?? 'new',
                        'note' => $asset['note'] ?? ''
                    ]);
                }
            }

            // Sync gallery images from TemporaryUpload
            if (!empty($mediaIds)) {
                $template->syncMediaAttachments($mediaIds, 'gallery');
            }

            return new RoomTemplateResource($template->load(['services', 'assets', 'media']));
        });
    }

    public function show($propertyId, $templateId)
    {
        $roomTemplate = RoomTemplate::where('property_id', $propertyId)->findOrFail($templateId);
        return new RoomTemplateResource(
            $roomTemplate->load(['services', 'assets', 'media'])
        );
    }

    public function update(RoomTemplateUpdateRequest $request, $propertyId, $templateId)
    {
        $roomTemplate = RoomTemplate::where('property_id', $propertyId)->findOrFail($templateId);
        return DB::transaction(function () use ($request, $roomTemplate) {
            $data = $request->validated();

            // Extract media_ids before updating
            $mediaIds = $data['media_ids'] ?? null;
            unset($data['media_ids']);

            $roomTemplate->update($data);

            if ($request->has('services')) {
                $roomTemplate->services()->sync($request->services);
            }

            if ($request->has('assets')) {
                $roomTemplate->assets()->delete();
                foreach ($request->assets as $asset) {
                    $roomTemplate->assets()->create([
                        'name' => $asset['name'],
                        'condition' => $asset['condition'] ?? 'new',
                        'note' => $asset['note'] ?? ''
                    ]);
                }
            }

            // Sync gallery images if provided
            if (!empty($mediaIds)) {
                $roomTemplate->syncMediaAttachments($mediaIds, 'gallery');
            }

            return new RoomTemplateResource(
                $roomTemplate->load(['services', 'assets', 'media'])
            );
        });
    }

    public function destroy($propertyId, $templateId)
    {
        $roomTemplate = RoomTemplate::where('property_id', $propertyId)->findOrFail($templateId);
        $roomTemplate->delete();
        return response()->json(['message' => 'Template deleted successfully']);
    }
}
