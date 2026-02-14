<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam property_id string required ID của tòa nhà (Property). Example: 9999-8888...
 * @bodyParam code string required Mã tầng. Example: F01
 * @bodyParam name string required Tên tầng. Example: Tầng 1
 * @bodyParam sort_order integer Thứ tự sắp xếp. Example: 1
 */
class FloorStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', 'exists:properties,id'],
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
