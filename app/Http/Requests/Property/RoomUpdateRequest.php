<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam code string Mã phòng. Example: P.101
 * @bodyParam name string Tên phòng. Example: Phòng 101
 * @bodyParam type string Loại phòng (studio, apartment, house, dormitory, other).
 * @bodyParam area number Diện tích.
 * @bodyParam capacity integer Sức chứa.
 * @bodyParam base_price number Giá cơ bản.
 * @bodyParam status string Trạng thái.
 * @bodyParam description string Mô tả.
 * @bodyParam amenities json Tiện nghi.
 * @bodyParam utilities json Dịch vụ.
 */
class RoomUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'string', 'max:50'],
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:studio,apartment,house,dormitory,other', 'max:20'],
            'area' => ['nullable', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'base_price' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:available,occupied,maintenance,reserved', 'max:20'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable', 'json'],
            'utilities' => ['nullable', 'json'],
        ];
    }
}
