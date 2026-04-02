<?php

namespace App\Features\Property\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam property_id string required ID của tòa nhà. Example: uuid
 * @bodyParam name string required Tên phòng. Example: Phòng 101
 * @bodyParam floor_id string ID của tầng (tùy chọn). Example: uuid
 */
class RoomQuickCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', 'exists:properties,id'],
            'name'        => ['required', 'string', 'max:255'],
            'floor_id'    => ['nullable', 'uuid', 'exists:floors,id'],
        ];
    }
}
