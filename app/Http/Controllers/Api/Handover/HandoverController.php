<?php

namespace App\Http\Controllers\Api\Handover;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class HandoverController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private \App\Services\Handover\HandoverService $handoverService) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\Handover\Handover::class);
        $handovers = $this->handoverService->paginate(
            $request->query('filter', []),
            $request->query('per_page', 15),
            $request->query('search')
        );
        return \App\Http\Resources\Handover\HandoverResource::collection($handovers);
    }

    public function store(\App\Http\Requests\Handover\HandoverStoreRequest $request)
    {
        $this->authorize('create', \App\Models\Handover\Handover::class);
        $handover = $this->handoverService->createDraft(
            $request->user()->org, 
            $request->validated()
        );
        return new \App\Http\Resources\Handover\HandoverResource($handover);
    }

    public function show(\App\Models\Handover\Handover $handover)
    {
        $this->authorize('view', $handover);
        return new \App\Http\Resources\Handover\HandoverResource($this->handoverService->getDetails($handover));
    }

    public function update(\App\Http\Requests\Handover\HandoverUpdateRequest $request, \App\Models\Handover\Handover $handover)
    {
        $this->authorize('update', $handover);
        $handover = $this->handoverService->updateDraft($handover, $request->validated());
        return new \App\Http\Resources\Handover\HandoverResource($handover);
    }

    public function destroy(\App\Models\Handover\Handover $handover)
    {
        $this->authorize('delete', $handover);
        $this->handoverService->deleteDraft($handover);
        return response()->noContent();
    }

    public function confirm(Request $request, \App\Models\Handover\Handover $handover)
    {
        $this->authorize('update', $handover);
        $handover = $this->handoverService->confirm($handover, $request->user()->id);
        return new \App\Http\Resources\Handover\HandoverResource($handover);
    }

    // =========================================================================
    // Quản lý Items
    // =========================================================================

    public function itemsIndex(\App\Models\Handover\Handover $handover)
    {
        return \App\Http\Resources\Handover\HandoverItemResource::collection($this->handoverService->getItems($handover));
    }

    public function itemsStore(\App\Http\Requests\Handover\HandoverItemStoreRequest $request, \App\Models\Handover\Handover $handover)
    {
        $item = $this->handoverService->addItem($handover, $request->validated());
        return new \App\Http\Resources\Handover\HandoverItemResource($item);
    }

    public function itemsUpdate(\App\Http\Requests\Handover\HandoverItemUpdateRequest $request, \App\Models\Handover\Handover $handover, \App\Models\Handover\HandoverItem $handoverItem)
    {
        $item = $this->handoverService->updateItem($handoverItem, $request->validated());
        return new \App\Http\Resources\Handover\HandoverItemResource($item);
    }

    public function itemsDestroy(\App\Models\Handover\Handover $handover, \App\Models\Handover\HandoverItem $handoverItem)
    {
        $this->handoverService->deleteItem($handoverItem);
        return response()->noContent();
    }

    // =========================================================================
    // Quản lý Snapshots
    // =========================================================================

    public function snapshotsIndex(\App\Models\Handover\Handover $handover)
    {
        return \App\Http\Resources\Handover\HandoverMeterSnapshotResource::collection($this->handoverService->getSnapshots($handover));
    }

    public function snapshotsStore(\App\Http\Requests\Handover\HandoverMeterSnapshotRequest $request, \App\Models\Handover\Handover $handover)
    {
        $snapshot = $this->handoverService->addSnapshot($handover, $request->validated());
        return new \App\Http\Resources\Handover\HandoverMeterSnapshotResource($snapshot);
    }

    public function snapshotsDestroy(\App\Models\Handover\Handover $handover, \App\Models\Handover\HandoverMeterSnapshot $handoverMeterSnapshot)
    {
        $this->handoverService->deleteSnapshot($handoverMeterSnapshot);
        return response()->noContent();
    }
}
