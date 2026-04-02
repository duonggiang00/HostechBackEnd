<?php

namespace App\Features\Property\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng mục mỗi trang. Default: 15. Example: 10
 * @queryParam page int Số trang. Example: 1
 * @queryParam sort string Sắp xếp theo trường (prefix '-' để giảm dần). Các trường hỗ trợ: name, purchased_at, warranty_end, created_at. Default: -created_at. Example: -created_at
 * @queryParam filter[name] string Lọc theo tên tài sản. Example: Điều hòa
 * @queryParam filter[serial] string Lọc theo số serial. Example: SN12345
 * @queryParam filter[condition] string Lọc theo tình trạng. Example: Mới
 */
class RoomAssetIndexRequest extends FormRequest
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
            'sort' => ['nullable', 'string'],
            'filter.name' => ['nullable', 'string'],
            'filter.serial' => ['nullable', 'string'],
            'filter.condition' => ['nullable', 'string'],
        ];
    }
}
