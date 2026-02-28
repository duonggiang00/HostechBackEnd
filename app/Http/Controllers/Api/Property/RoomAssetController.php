<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RoomAssetStoreRequest;
use App\Http\Requests\Property\RoomAssetUpdateRequest;
use App\Http\Resources\Property\RoomAssetResource;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Services\Property\RoomAssetService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

#[Group('Room Assets')]
class RoomAssetController extends Controller
{
    public function __construct(
        protected RoomAssetService $assetService
    ) {}

    /**
     * Danh sách tài sản trong phòng
     *
     * Lấy danh sách thiết bị, tài sản kèm theo của một phòng cụ thể.
     *
     * @queryParam per_page int Số lượng mục mỗi trang. Default: 15. Example: 10
     * @queryParam page int Số trang. Example: 1
     * @queryParam sort string Sắp xếp theo trường (prefix '-' để giảm dần). Các trường hỗ trợ: name, purchased_at, warranty_end, created_at. Default: -created_at. Example: -created_at
     * @queryParam filter[name] string Lọc theo tên tài sản. Example: Điều hòa
     * @queryParam filter[serial] string Lọc theo số serial. Example: SN12345
     * @queryParam filter[condition] string Lọc theo tình trạng. Example: Mới
     */
    public function index(Request $request, string $property, string $room)
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
