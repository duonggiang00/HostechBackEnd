<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi trên một trang. Mặc định 15. Example: 10
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam search string Từ khóa tìm kiếm (tên, mã). Example: P.101
 */
class RoomIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'string'],
            'with_trashed' => ['nullable', 'boolean'],
            'filter.code' => ['nullable', 'string'],
            'filter.status' => ['nullable', 'string'],
            'filter.type' => ['nullable', 'string'],
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.floor_id' => ['nullable', 'uuid'],
            'sort' => ['nullable', 'string', 'in:code,status,type,created_at,-code,-status,-type,-created_at'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'with_trashed' => 'Bao gồm bản ghi đã xóa',
            'filter.code' => 'Mã phòng',
            'filter.status' => 'Trạng thái',
            'filter.type' => 'Loại phòng',
            'filter.property_id' => 'ID Bất động sản',
            'filter.floor_id' => 'ID Tầng',
            'sort' => 'Sắp xếp',
        ];
    }
}
