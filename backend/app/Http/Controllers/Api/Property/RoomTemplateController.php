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
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string|null  $propertyId
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
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
            ->get();

        return RoomTemplateResource::collection($templates);
    }

    public function store(RoomTemplateStoreRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $template = RoomTemplate::create($request->validated());

            if ($request->has('services')) {
                $template->services()->sync($request->services);
            }

            if ($request->has('assets')) {
                foreach ($request->assets as $assetName) {
                    $template->assets()->create(['name' => $assetName]);
                }
            }


            return new RoomTemplateResource($template->load(['services', 'assets']));
        });
    }

    public function show(RoomTemplate $roomTemplate)
    {
        return new RoomTemplateResource($roomTemplate->load(['services', 'assets']));
    }

    public function update(RoomTemplateUpdateRequest $request, RoomTemplate $roomTemplate)
    {
        return DB::transaction(function () use ($request, $roomTemplate) {
            $roomTemplate->update($request->validated());

            if ($request->has('services')) {
                $roomTemplate->services()->sync($request->services);
            }

            if ($request->has('assets')) {
                $roomTemplate->assets()->delete();
                foreach ($request->assets as $assetName) {
                    $roomTemplate->assets()->create(['name' => $assetName]);
                }
            }


            return new RoomTemplateResource($roomTemplate->load(['services', 'assets']));
        });
    }

    public function destroy(RoomTemplate $roomTemplate)
    {
        $roomTemplate->delete();
        return response()->json(['message' => 'Template deleted successfully']);
    }
}
