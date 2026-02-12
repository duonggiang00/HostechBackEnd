<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrgStoreRequest;
use App\Http\Requests\OrgUpdateRequest;
use App\Http\Resources\OrgResource;
use App\Models\Org;

class OrgController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Org::class);

        $query = Org::query();

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $orgs = $query->paginate(15);

        return OrgResource::collection($orgs)->response()->setStatusCode(200);
    }

    public function store(OrgStoreRequest $request)
    {
        $this->authorize('create', Org::class);

        $org = Org::create($request->validated());

        return new OrgResource($org);
    }

    public function show(string $id)
    {
        $org = Org::find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $org);

        return new OrgResource($org);
    }

    public function update(OrgUpdateRequest $request, string $id)
    {
        $org = Org::find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $org);

        $org->update($request->validated());

        return new OrgResource($org);
    }

    public function destroy(string $id)
    {
        $org = Org::find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $org);

        $org->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    public function restore(string $id)
    {
        $org = Org::onlyTrashed()->find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $org);

        $org->restore();

        return new OrgResource($org);
    }

    public function forceDelete(string $id)
    {
        $org = Org::withTrashed()->find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $org);

        $org->forceDelete();

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
