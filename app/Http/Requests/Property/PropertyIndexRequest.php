<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi trên một trang. Mặc định 15. Example: 10
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam search string Từ khóa tìm kiếm (tên, mã). Example: Building A
 */
class PropertyIndexRequest extends FormRequest
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
            'org_id' => ['nullable', 'uuid'],
            'filter.name' => ['nullable', 'string'],
            'filter.code' => ['nullable', 'string'],
            'sort' => ['nullable', 'string', 'in:name,code,created_at,-name,-code,-created_at'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'with_trashed' => 'Bao gồm bản ghi đã xóa',
            'org_id' => 'ID Tổ chức',
            'filter.name' => 'Tên bất động sản',
            'filter.code' => 'Mã bất động sản',
            'sort' => 'Sắp xếp',
        ];
    }
}
