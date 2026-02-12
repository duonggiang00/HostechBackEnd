<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FloorStoreRequest;
use App\Http\Requests\FloorUpdateRequest;
use App\Http\Resources\FloorResource;
use App\Models\Floor;
use Spatie\QueryBuilder\QueryBuilder;

class FloorController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Floor::class);

        $query = QueryBuilder::for(Floor::class)
            ->allowedFilters(['property_id', 'name', 'code'])
            ->defaultSort('sort_order');

        return FloorResource::collection($query->paginate(15))->response()->setStatusCode(200);
    }

    public function store(FloorStoreRequest $request)
    {
        $this->authorize('create', Floor::class);

        $data = $request->validated();
        $data['org_id'] = request()->header('X-Org-Id');

        $floor = Floor::create($data);

        return new FloorResource($floor);
    }

    public function show(string $id)
    {
        $floor = Floor::find($id);
        if (! $floor) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $floor);

        return new FloorResource($floor);
    }

    public function update(FloorUpdateRequest $request, string $id)
    {
        $floor = Floor::find($id);
        if (! $floor) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $floor);

        $floor->update($request->validated());

        return new FloorResource($floor);
    }

    public function destroy(string $id)
    {
        $floor = Floor::find($id);
        if (! $floor) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $floor);

        $floor->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
