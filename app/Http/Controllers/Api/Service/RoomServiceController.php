<?php

namespace App\Http\Controllers\Api\Service;

use App\Http\Controllers\Controller;
use App\Http\Requests\Service\RoomServiceStoreRequest;
use App\Http\Requests\Service\RoomServiceUpdateRequest;
use App\Http\Resources\Service\RoomServiceResource;
use App\Models\Property\Room;
use App\Models\Service\RoomService;
use Dedoc\Scramble\Attributes\Group;

/**
 * Quản lý Dịch vụ từng Phòng
 * 
 * API gán, sửa, xóa và liệt kê các dịch vụ đang được sử dụng tại một phòng cụ thể.
 */
#[Group('Dịch vụ Phòng')]
class RoomServiceController extends Controller
{
    /**
     * Danh sách Dịch vụ của Phòng
     * 
     * Lấy danh sách các dịch vụ đang được gán cho một phòng.
     */
    public function index(string $roomId)
    {
        // Require the room to be located first
        $room = Room::where('org_id', request()->user()->org_id)->findOrFail($roomId);
        
        $services = RoomService::with(['service.currentRate.tieredRates'])
            ->where('room_id', $room->id)
            ->get();

        return RoomServiceResource::collection($services);
    }

    /**
     * Gán Dịch vụ cho Phòng
     * 
     * Thêm một dịch vụ mới vào sử dụng tại phòng này.
     */
    public function store(RoomServiceStoreRequest $request, string $roomId)
    {
        $room = Room::where('org_id', request()->user()->org_id)->findOrFail($roomId);
        
        $data = $request->validated();
        $data['org_id'] = $room->org_id;
        $data['room_id'] = $room->id;

        $roomService = RoomService::create($data);
        $roomService->load('service.currentRate.tieredRates');

        return new RoomServiceResource($roomService);
    }

    /**
     * Xem thông tin cài đặt Dịch vụ
     */
    public function show(string $roomId, string $id)
    {
        $roomService = RoomService::with(['service.currentRate.tieredRates'])
            ->where('room_id', $roomId)
            ->where('org_id', request()->user()->org_id)
            ->findOrFail($id);
            
        return new RoomServiceResource($roomService);
    }

    /**
     * Cập nhật cài đặt Dịch vụ trên Phòng
     * 
     * Chỉnh sửa số lượng, định mức bao hoặc metadata.
     */
    public function update(RoomServiceUpdateRequest $request, string $roomId, string $id)
    {
        $roomService = RoomService::where('room_id', $roomId)
            ->where('org_id', request()->user()->org_id)
            ->findOrFail($id);

        $roomService->update($request->validated());
        $roomService->loadMissing('service.currentRate.tieredRates');

        return new RoomServiceResource($roomService);
    }

    /**
     * Gỡ Dịch vụ khỏi Phòng
     */
    public function destroy(string $roomId, string $id)
    {
        $roomService = RoomService::where('room_id', $roomId)
            ->where('org_id', request()->user()->org_id)
            ->findOrFail($id);

        $roomService->delete();

        return response()->json(['message' => 'Service detached from room successfully.']);
    }
}
