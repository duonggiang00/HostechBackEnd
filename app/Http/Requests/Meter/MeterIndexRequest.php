<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page integer Số lượng bản ghi trên một trang (mặc định: 15). Example: 15
 * @queryParam page int Số trang. Example: 1
 * @queryParam search string Tìm kiếm theo mã đồng hồ (code) hoặc tên phòng.
 * @queryParam sort string Sắp xếp kết quả (installed_at, code, type, created_at). Thêm dấu trừ (-) phía trước để sắp xếp giảm dần. Mặc định: -created_at. Example: -created_at
 * @queryParam filter[type] string Lọc theo loại đồng hồ (ELECTRIC, WATER). Example: ELECTRIC
 * @queryParam filter[is_active] boolean Lọc theo trạng thái hoạt động (1 hoặc 0). Example: 1
 * @queryParam filter[room_id] string Lọc đồng hồ theo ID phòng.
 * @queryParam filter[property_id] string Lọc đồng hồ theo ID tòa nhà.
 * @queryParam filter[floor_id] string Lọc đồng hồ theo ID tầng.
 * @queryParam include string Các relations muốn load kèm (ngăn cách bởi dấu phẩy): room, room.property, room.floor. Example: room
 */
class MeterIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string'],
            'filter' => ['nullable', 'array'],
            'include' => ['nullable', 'string'],
        ];
    }
}
