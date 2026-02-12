<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomIndexRequest;
use App\Http\Requests\RoomStoreRequest;
use App\Http\Requests\RoomUpdateRequest;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use App\Services\RoomService;

class RoomController extends Controller
{
    public function __construct(protected RoomService $service) {}

    public function index(RoomIndexRequest $request)
    {
        $this->authorize('viewAny', Room::class);

        $perPage = (int) $request->query('per_page', 15);
        $allowed = ['code', 'status', 'type', 'property_id'];

        $paginator = $this->service->paginate($allowed, $perPage);

        return RoomResource::collection($paginator)->response()->setStatusCode(200);
    }

    public function store(RoomStoreRequest $request)
    {
        $this->authorize('create', Room::class);

        $data = $request->validated();
        $data['org_id'] = request()->header('X-Org-Id');

        $room = $this->service->create($data);

        return new RoomResource($room);
    }

    public function show(string $id)
    {
        $room = $this->service->find($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $room);

        return new RoomResource($room);
    }

    public function update(RoomUpdateRequest $request, string $id)
    {
        $room = $this->service->find($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $room);

        $updated = $this->service->update($id, $request->validated());

        return new RoomResource($updated);
    }

    public function destroy(string $id)
    {
        $room = $this->service->find($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $room);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    public function restore(string $id)
    {
        $room = $this->service->findTrashed($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $room);

        $this->service->restore($id);

        return new RoomResource($room);
    }

    public function forceDelete(string $id)
    {
        $room = $this->service->findWithTrashed($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $room);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
