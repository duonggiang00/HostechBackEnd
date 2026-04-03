<?php

namespace App\Features\Handover\Controllers;

use App\Features\Handover\Requests\HandoverItemStoreRequest;
use App\Features\Handover\Resources\HandoverItemResource;
use App\Features\Handover\Resources\HandoverMeterSnapshotResource;
use App\Features\Handover\Resources\HandoverResource;
use App\Http\Controllers\Controller;
use App\Features\Handover\Requests\HandoverIndexRequest;

use App\Features\Handover\Requests\HandoverItemUpdateRequest;
use App\Features\Handover\Requests\HandoverMeterSnapshotRequest;
use App\Features\Handover\Requests\HandoverStoreRequest;
use App\Features\Handover\Requests\HandoverUpdateRequest;
use App\Features\Handover\Models\Handover;
use App\Features\Handover\Models\HandoverItem;
use App\Features\Handover\Models\HandoverMeterSnapshot;
use App\Features\Handover\Services\HandoverService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

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
