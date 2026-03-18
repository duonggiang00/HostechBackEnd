<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class RoomQuickCreateBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', 'exists:properties,id'],
            'floor_id' => ['nullable', 'uuid', 'exists:floors,id'],
            'prefix' => ['nullable', 'string', 'max:50'],
            'count' => ['required', 'integer', 'min:1', 'max:50'],
            'start_number' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
