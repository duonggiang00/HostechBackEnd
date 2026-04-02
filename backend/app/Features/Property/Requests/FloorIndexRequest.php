<?php

namespace App\Features\Property\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi trên một trang. Mặc định 15. Example: 10
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam search string Từ khóa tìm kiếm (tên, mã). Example: Tầng 1
 * @queryParam with_trashed boolean Bao gồm bản ghi đã xóa. Example: true
 * @queryParam filter[property_id] string Lọc theo ID tòa nhà (UUID). Example: 9b2d9e8a-7b3c-4e8d-a1b2-c3d4e5f6g7h8
 * @queryParam filter[name] string Lọc theo tên tầng.
 * @queryParam filter[code] string Lọc theo mã tầng.
 * @queryParam sort string Sắp xếp kết quả (name, code, sort_order, created_at, prefixed with - for DESC). Example: -sort_order
 */
class FloorIndexRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'string'],
            'with_trashed' => ['nullable', 'boolean'],
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.name' => ['nullable', 'string'],
            'filter.code' => ['nullable', 'string'],
            'sort' => ['nullable', 'string', 'in:name,code,sort_order,created_at,-name,-code,-sort_order,-created_at'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'with_trashed' => 'Bao gồm bản ghi đã xóa',
            'filter.property_id' => 'ID Bất động sản',
            'filter.name' => 'Tên tầng',
            'filter.code' => 'Mã tầng',
            'sort' => 'Sắp xếp',
        ];
    }
}
