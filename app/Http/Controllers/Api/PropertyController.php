<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertyIndexRequest;
use App\Http\Requests\PropertyStoreRequest;
use App\Http\Requests\PropertyUpdateRequest;
use App\Http\Resources\PropertyResource;
use App\Services\PropertyService;

class PropertyController extends Controller
{
    public function __construct(protected PropertyService $service)
    {
    }

    public function index(PropertyIndexRequest $request)
    {
        $perPage = (int) $request->query('per_page', 15);
        $allowed = ['name', 'code'];

        $paginator = $this->service->paginate($allowed, $perPage);

        return PropertyResource::collection($paginator)->response()->setStatusCode(200);
    }

    public function store(PropertyStoreRequest $request)
    {
        $data = $request->validated();
        $data['org_id'] = request()->header('X-Org-Id');

        $property = $this->service->create($data);

        return new PropertyResource($property);
    }

    public function show(string $id)
    {
        $property = $this->service->find($id);
        if (!$property) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return new PropertyResource($property);
    }

    public function update(PropertyUpdateRequest $request, string $id)
    {
        $property = $this->service->find($id);
        if (!$property) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $updated = $this->service->update($id, $request->validated());

        return new PropertyResource($updated);
    }

    public function destroy(string $id)
    {
        $property = $this->service->find($id);
        if (!$property) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}

