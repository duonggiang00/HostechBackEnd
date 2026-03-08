<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RoomAssetIndexRequest;
use App\Http\Requests\Property\RoomAssetStoreRequest;
use App\Http\Requests\Property\RoomAssetUpdateRequest;
use App\Http\Resources\Property\RoomAssetResource;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Services\Property\RoomAssetService;
use Dedoc\Scramble\Attributes\Group;

#[Group('Room Assets')]
class RoomAssetController extends Controller
{
    public function __construct(
        protected RoomAssetService $assetService
    ) {}

    /**
     * Danh sách tài sản trong phòng
     */
    public function index(RoomAssetIndexRequest $request, string $property, string $room)
    {
        $roomModel = Room::findOrFail($room);
        $this->authorize('viewAny', [RoomAsset::class, $roomModel]);

        $perPage = $request->integer('per_page', 15);

        $assets = $this->assetService->getAssetsByRoom($room, $perPage);

        return RoomAssetResource::collection($assets);
    }

    /**
     * Thêm tài sản mới vào phòng
     *
     * Khai báo một tài sản/thiết bị mới được trang bị cho phòng.
     */
    public function store(RoomAssetStoreRequest $request, string $property, string $room)
    {
        $roomModel = Room::findOrFail($room);
        $this->authorize('create', [RoomAsset::class, $roomModel]);

        $asset = $this->assetService->createAsset($room, $request->validated());

        return new RoomAssetResource($asset);
    }

    /**
     * Xem chi tiết tài sản
     *
     * Lấy thông tin chi tiết của một tài sản cụ thể trong phòng.
     */
    public function show(string $property, string $room, string $asset)
    {
        $assetModel = $this->assetService->getAssetById($asset);

        $this->authorize('view', $assetModel);

        // Đảm bảo tài sản thuộc về đúng phòng
        abort_if($assetModel->room_id !== $room, 404, 'Tài sản không thuộc phòng này.');

        return new RoomAssetResource($assetModel);
    }

    /**
     * Cập nhật thông tin tài sản
     *
     * Cập nhật tình trạng, ghi chú hoặc thông tin bảo hành của tài sản.
     */
    public function update(RoomAssetUpdateRequest $request, string $property, string $room, string $asset)
    {
        $assetModel = $this->assetService->getAssetById($asset);

        $this->authorize('update', $assetModel);

        abort_if($assetModel->room_id !== $room, 404, 'Tài sản không thuộc phòng này.');

        $updated = $this->assetService->updateAsset($asset, $request->validated());

        return new RoomAssetResource($updated);
    }

    /**
     * Xóa/Thanh lý tài sản
     *
     * Xóa một tài sản khỏi danh sách của phòng.
     */
    public function destroy(string $property, string $room, string $asset)
    {
        $assetModel = $this->assetService->getAssetById($asset);

        $this->authorize('delete', $assetModel);

        abort_if($assetModel->room_id !== $room, 404, 'Tài sản không thuộc phòng này.');

        $this->assetService->deleteAsset($asset);

        return response()->noContent();
    }
}
