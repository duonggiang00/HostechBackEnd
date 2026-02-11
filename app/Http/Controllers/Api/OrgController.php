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
        $orgs = Org::paginate(15);

        return OrgResource::collection($orgs)->response()->setStatusCode(200);
    }

    public function store(OrgStoreRequest $request)
    {
        $org = Org::create($request->validated());

        return new OrgResource($org);
    }

    public function show(string $id)
    {
        $org = Org::find($id);
        if (!$org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return new OrgResource($org);
    }

    public function update(OrgUpdateRequest $request, string $id)
    {
        $org = Org::find($id);
        if (!$org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $org->update($request->validated());

        return new OrgResource($org);
    }

    public function destroy(string $id)
    {
        $org = Org::find($id);
        if (!$org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $org->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
