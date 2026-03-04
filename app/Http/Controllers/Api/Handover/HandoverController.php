<?php

namespace App\Http\Controllers\Api\Handover;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use App\Http\Requests\Handover\HandoverIndexRequest;
use App\Http\Requests\Handover\HandoverStoreRequest;
use App\Http\Requests\Handover\HandoverUpdateRequest;
use App\Http\Requests\Handover\HandoverItemStoreRequest;
use App\Http\Requests\Handover\HandoverItemUpdateRequest;
use App\Http\Requests\Handover\HandoverMeterSnapshotRequest;
use App\Http\Resources\Handover\HandoverResource;
use App\Http\Resources\Handover\HandoverItemResource;
use App\Http\Resources\Handover\HandoverMeterSnapshotResource;
use App\Models\Handover\Handover;
use App\Models\Handover\HandoverItem;
use App\Models\Handover\HandoverMeterSnapshot;
use App\Services\Handover\HandoverService;

class HandoverController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private HandoverService $handoverService) {}

    public function index(HandoverIndexRequest $request)
    {
        $this->authorize('viewAny', Handover::class);
        $handovers = $this->handoverService->paginate(
            $request->query('filter', []),
            $request->query('per_page', 15),
            $request->query('search')
        );

        return HandoverResource::collection($handovers);
    }

    public function store(HandoverStoreRequest $request)
    {
        $this->authorize('create', Handover::class);
        $handover = $this->handoverService->createDraft(
            $request->user()->org,
            $request->validated()
        );

        return new HandoverResource($handover);
    }

    public function show(Handover $handover)
    {
        $this->authorize('view', $handover);

        return new HandoverResource($this->handoverService->getDetails($handover));
    }

    public function update(HandoverUpdateRequest $request, Handover $handover)
    {
        $this->authorize('update', $handover);
        $handover = $this->handoverService->updateDraft($handover, $request->validated());

        return new HandoverResource($handover);
    }

    public function destroy(Handover $handover)
    {
        $this->authorize('delete', $handover);
        $this->handoverService->deleteDraft($handover);

        return response()->noContent();
    }

    public function confirm(Request $request, Handover $handover)
    {
        $this->authorize('update', $handover);
        $handover = $this->handoverService->confirm($handover, $request->user()->id);

        return new HandoverResource($handover);
    }

    // =========================================================================
    // Quản lý Items
    // =========================================================================

    public function itemsIndex(Handover $handover)
    {
        return HandoverItemResource::collection($this->handoverService->getItems($handover));
    }

    public function itemsStore(HandoverItemStoreRequest $request, Handover $handover)
    {
        $item = $this->handoverService->addItem($handover, $request->validated());

        return new HandoverItemResource($item);
    }

    public function itemsUpdate(HandoverItemUpdateRequest $request, Handover $handover, HandoverItem $handoverItem)
    {
        $item = $this->handoverService->updateItem($handoverItem, $request->validated());

        return new HandoverItemResource($item);
    }

    public function itemsDestroy(Handover $handover, HandoverItem $handoverItem)
    {
        $this->handoverService->deleteItem($handoverItem);

        return response()->noContent();
    }

    // =========================================================================
    // Quản lý Snapshots
    // =========================================================================

    public function snapshotsIndex(Handover $handover)
    {
        return HandoverMeterSnapshotResource::collection($this->handoverService->getSnapshots($handover));
    }

    public function snapshotsStore(HandoverMeterSnapshotRequest $request, Handover $handover)
    {
        $snapshot = $this->handoverService->addSnapshot($handover, $request->validated());

        return new HandoverMeterSnapshotResource($snapshot);
    }

    public function snapshotsDestroy(Handover $handover, HandoverMeterSnapshot $handoverMeterSnapshot)
    {
        $this->handoverService->deleteSnapshot($handoverMeterSnapshot);

        return response()->noContent();
    }
}
