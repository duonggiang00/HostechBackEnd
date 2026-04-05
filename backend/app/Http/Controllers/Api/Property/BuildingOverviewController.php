<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\SyncBuildingOverviewRequest;
use App\Http\Resources\Property\BuildingOverviewResource;
use App\Models\Property\Property;
use App\Services\Property\BuildingOverviewService;
use Dedoc\Scramble\Attributes\Group;

/**
 * Mặt bằng tòa nhà (Building Overview)
 *
 * API chuyên biệt để lấy và đồng bộ cấu trúc không gian lưới (Grid)
 * của tòa nhà gồm tầng và phòng.
 */
#[Group('Mặt bằng tòa nhà')]
class BuildingOverviewController extends Controller
{
    public function __construct(protected BuildingOverviewService $service) {}

    /**
     * Lấy mặt bằng tòa nhà
     *
     * Trả về toàn bộ cấu trúc tòa nhà (Property → Floors → Rooms)
     * kèm vị trí Grid của từng phòng và danh sách Room Templates.
     */
    public function show(string $id)
    {
        $property = Property::findOrFail($id);

        $this->authorize('view', $property);

        $layout = $this->service->getLayout($property);

        return new BuildingOverviewResource($layout);
    }

    /**
     * Đồng bộ mặt bằng tòa nhà (Batch Sync)
     *
     * Tạo tầng mới, tạo phòng mới, cập nhật vị trí Grid, và xóa
     * các phòng/tầng bị loại bỏ — tất cả trong một request nguyên tử.
     *
     * Chỉ dành cho Manager.
     */
    public function sync(SyncBuildingOverviewRequest $request, string $id)
    {
        $property = Property::findOrFail($id);

        $this->authorize('update', $property);

        $layout = $this->service->syncLayout(
            $property,
            $request->validated(),
            $request->user()
        );

        return new BuildingOverviewResource($layout);
    }
}
