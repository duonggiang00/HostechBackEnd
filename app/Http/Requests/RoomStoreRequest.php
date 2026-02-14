<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam property_id string required ID của tòa nhà.
 * @bodyParam floor_id string ID của tầng.
 * @bodyParam code string required Mã phòng. Example: P.101
 * @bodyParam name string required Tên phòng. Example: Phòng 101
 * @bodyParam type string Loại phòng (studio, apartment, house, dormitory, other). Example: studio
 * @bodyParam area number Diện tích (m2). Example: 30.5
 * @bodyParam capacity integer Sức chứa (người). Example: 2
 * @bodyParam base_price number Giá cơ bản. Example: 5000000
 * @bodyParam status string Trạng thái (available, occupied, maintenance, reserved). Example: available
 * @bodyParam description string Mô tả thêm.
 * @bodyParam amenities json Tiện nghi.
 * @bodyParam utilities json Dịch vụ/Tiện ích.
 */
class RoomStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', 'exists:properties,id'],
            'floor_id' => ['nullable', 'uuid', 'exists:floors,id'],
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:studio,apartment,house,dormitory,other', 'max:20'],
            'area' => ['nullable', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:available,occupied,maintenance,reserved', 'max:20'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable', 'json'],
            'utilities' => ['nullable', 'json'],
        ];
    }
}
