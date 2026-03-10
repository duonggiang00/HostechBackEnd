<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam code string Mã phòng mới (override code tự sinh). Example: P.101
 * @bodyParam base_price number Giá cơ bản (phải > 0). Example: 5000000
 */
class RoomPublishRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code'       => ['nullable', 'string', 'max:50'],
            'base_price' => ['nullable', 'numeric', 'min:0.01'],
        ];
    }
}
