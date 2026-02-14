<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi trên một trang. Mặc định 15. Example: 10
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam search string Từ khóa tìm kiếm (tên, mã). Example: Tầng 1
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
            /**
             * @queryParam filter[property_id] string Lọc theo ID tòa nhà.
             * @queryParam filter[name] string Lọc theo tên tầng.
             * @queryParam filter[code] string Lọc theo mã tầng.
             */
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.name' => ['nullable', 'string'],
            'filter.code' => ['nullable', 'string'],
            'sort' => ['nullable', 'string'],
        ];
    }
}
