<?php

namespace App\Http\Controllers\Api\Service;

use App\Http\Controllers\Controller;
use App\Http\Requests\Service\RoomServiceStoreRequest;
use App\Http\Requests\Service\RoomServiceUpdateRequest;
use App\Http\Resources\Service\RoomServiceResource;
use App\Services\Service\ServiceService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Quản lý Dịch vụ từng Phòng
 *
 * API gán, sửa, xóa và liệt kê các dịch vụ đang được sử dụng tại một phòng cụ thể.
 */
#[Group('Dịch vụ Phòng')]
class RoomServiceController extends Controller
{
    public function __construct(protected ServiceService $service) {}

    /**
     * Danh sách Dịch vụ của Phòng
     *
     * Lấy danh sách các dịch vụ đang được gán cho một phòng.
     */
    public function index(string $roomId): AnonymousResourceCollection
    {
        $orgId = request()->user()->org_id;
        $services = $this->service->getRoomServices($roomId, $orgId);

        return RoomServiceResource::collection($services);
    }

    /**
     * Gán Dịch vụ cho Phòng
     *
     * Thêm một dịch vụ mới vào sử dụng tại phòng này.
     */
    public function store(RoomServiceStoreRequest $request, string $roomId): RoomServiceResource
    {
        $orgId = $request->user()->org_id;
        $roomService = $this->service->attachToRoom($roomId, $request->validated(), $orgId);
        $roomService->load('service.currentRate.tieredRates');

        return new RoomServiceResource($roomService);
    }

    /**
     * Xem thông tin cài đặt Dịch vụ
     */
    public function show(string $roomId, string $id): RoomServiceResource
    {
        $orgId = request()->user()->org_id;
        $roomService = $this->service->findRoomService($id, $orgId);

        if (! $roomService || $roomService->room_id !== $roomId) {
            abort(404);
        }

        return new RoomServiceResource($roomService);
    }

    /**
     * Cập nhật cài đặt Dịch vụ trên Phòng
     *
     * Chỉnh sửa số lượng, định mức bao hoặc metadata.
     */
    public function update(RoomServiceUpdateRequest $request, string $roomId, string $id): RoomServiceResource
    {
        $orgId = $request->user()->org_id;
        $roomService = $this->service->findRoomService($id, $orgId);

        if (! $roomService || $roomService->room_id !== $roomId) {
            abort(404);
        }

        $this->service->updateRoomService($roomService, $request->validated());
        $roomService->loadMissing('service.currentRate.tieredRates');

        return new RoomServiceResource($roomService);
    }

    /**
     * Gỡ Dịch vụ khỏi Phòng
     */
    public function destroy(string $roomId, string $id): JsonResponse
    {
        $orgId = request()->user()->org_id;
        $roomService = $this->service->findRoomService($id, $orgId);

        if (! $roomService || $roomService->room_id !== $roomId) {
            abort(404);
        }

        $this->service->detachFromRoom($roomService);

        return response()->json(['message' => 'Service detached from room successfully.']);
    }
}
