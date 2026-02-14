<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam code string Mã tầng. Example: F01-UPDATED
 * @bodyParam name string Tên tầng. Example: Tầng 1 (Mới)
 * @bodyParam sort_order integer Thứ tự sắp xếp. Example: 2
 */
class FloorUpdateRequest extends FormRequest
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
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
