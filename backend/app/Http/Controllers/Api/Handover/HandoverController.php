<?php

namespace App\Http\Controllers\Api\Handover;

use App\Http\Controllers\Controller;
use App\Http\Requests\Handover\HandoverIndexRequest;
use App\Http\Requests\Handover\HandoverItemStoreRequest;
use App\Http\Requests\Handover\HandoverItemUpdateRequest;
use App\Http\Requests\Handover\HandoverMeterSnapshotRequest;
use App\Http\Requests\Handover\HandoverStoreRequest;
use App\Http\Requests\Handover\HandoverUpdateRequest;
use App\Http\Resources\Handover\HandoverItemResource;
use App\Http\Resources\Handover\HandoverMeterSnapshotResource;
use App\Http\Resources\Handover\HandoverResource;
use App\Models\Handover\Handover;
use App\Models\Handover\HandoverItem;
use App\Models\Handover\HandoverMeterSnapshot;
use App\Services\Handover\HandoverService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
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
            $request->user()?->org_id,
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

    // =========================================================================
    // Quản lý Items
    // =========================================================================

    public function itemsIndex(Handover $handover)
    {
        $this->authorize('view', $handover);

        return HandoverItemResource::collection($this->handoverService->getItems($handover));
    }

    public function itemsStore(HandoverItemStoreRequest $request, Handover $handover)
    {
        $this->authorize('update', $handover);
        $item = $this->handoverService->addItem($handover, $request->validated());

        return new HandoverItemResource($item);
    }

    public function itemsUpdate(HandoverItemUpdateRequest $request, Handover $handover, HandoverItem $handoverItem)
    {
        $this->authorize('update', $handover);
        $item = $this->handoverService->updateItem($handoverItem, $request->validated());

        return new HandoverItemResource($item);
    }

    public function itemsDestroy(Handover $handover, HandoverItem $handoverItem)
    {
        $this->authorize('update', $handover);
        $this->handoverService->deleteItem($handoverItem);

        return response()->noContent();
    }

    /**
     * Ảnh minh chứng tình trạng phòng (chung), không gắn từng handover item.
     */
    public function documentScanStore(Request $request, Handover $handover): JsonResponse
    {
        $this->authorize('update', $handover);

        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ], [
            'image.required' => 'Vui lòng chọn ảnh.',
            'image.image' => 'Tệp phải là ảnh.',
            'image.max' => 'Ảnh không được vượt quá 5MB.',
        ]);

        $media = $handover
            ->addMediaFromRequest('image')
            ->toMediaCollection('document_scans');

        return response()->json([
            'message' => 'Đã tải ảnh lên.',
            'url' => $media->getUrl(),
            'id' => $media->id,
        ], 201);
    }

    public function itemPhotoStore(Request $request, Handover $handover, HandoverItem $handoverItem): JsonResponse
    {
        $this->authorize('update', $handover);
        if ($handoverItem->handover_id !== $handover->id) {
            abort(404);
        }

        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ], [
            'image.required' => 'Vui lòng chọn ảnh.',
            'image.image' => 'Tệp phải là ảnh.',
            'image.max' => 'Ảnh không được vượt quá 5MB.',
        ]);

        $media = $handoverItem
            ->addMediaFromRequest('image')
            ->toMediaCollection('condition_photos');

        return response()->json([
            'message' => 'Đã tải ảnh lên.',
            'url' => $media->getUrl(),
            'id' => $media->id,
        ], 201);
    }

    // =========================================================================
    // Quản lý Snapshots
    // =========================================================================

    public function snapshotsIndex(Handover $handover)
    {
        $this->authorize('view', $handover);

        return HandoverMeterSnapshotResource::collection($this->handoverService->getSnapshots($handover));
    }

    public function snapshotsStore(HandoverMeterSnapshotRequest $request, Handover $handover)
    {
        $this->authorize('update', $handover);
        $snapshot = $this->handoverService->addSnapshot($handover, $request->validated());

        return new HandoverMeterSnapshotResource($snapshot);
    }

    public function snapshotsDestroy(Handover $handover, HandoverMeterSnapshot $handoverMeterSnapshot)
    {
        $this->authorize('update', $handover);
        $this->handoverService->deleteSnapshot($handoverMeterSnapshot);

        return response()->noContent();
    }
}
