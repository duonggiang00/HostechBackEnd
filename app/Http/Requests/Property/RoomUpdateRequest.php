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
 * @bodyParam media_ids string[] Mảng chứa danh sách ID của media (upload files). Example: ["uuid-1234"]
 * @bodyParam assets object[] Mảng cấu hình các thiết bị, tài sản trong phòng.
 * @bodyParam assets[].id string ID của tài sản (Nếu là tài sản cũ muốn update). Example: uuid-1234
 * @bodyParam assets[].name string required Tên tài sản. Example: Tivi Samsung
 * @bodyParam assets[].serial string Số series của tài sản. Example: 12345XYZ
 * @bodyParam assets[].condition string Tình trạng của tài sản (Mới, Cũ, ...). Example: Mới 100%
 * @bodyParam assets[].purchased_at date Ngày mua. Example: 2024-01-01
 * @bodyParam assets[].warranty_end date Hạn bảo hành. Example: 2026-01-01
 * @bodyParam assets[].note string Ghi chú thêm về tài sản.
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
            
            // Thêm các trường upload/relation
            'media_ids' => ['nullable', 'array'],
            'media_ids.*' => ['uuid'],
            
            'assets' => ['nullable', 'array'],
            'assets.*.id' => ['nullable', 'uuid'],
            'assets.*.name' => ['required', 'string', 'max:255'],
            'assets.*.serial' => ['nullable', 'string', 'max:100'],
            'assets.*.condition' => ['nullable', 'string', 'max:50'],
            'assets.*.purchased_at' => ['nullable', 'date'],
            'assets.*.warranty_end' => ['nullable', 'date'],
            'assets.*.note' => ['nullable', 'string'],
        ];
    }
}
