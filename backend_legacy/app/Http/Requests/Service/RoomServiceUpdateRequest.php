<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam quantity int Số lượng. Example: 2
 * @bodyParam included_units int Số đơn vị miễn phí. Example: 5
 * @bodyParam meta json Thuộc tính JSON bổ sung.
 */
class RoomServiceUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'included_units' => ['nullable', 'integer', 'min:0'],
            'meta' => ['nullable', 'json'],
        ];
    }
}
