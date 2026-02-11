<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter.code' => ['nullable', 'string'],
            'filter.status' => ['nullable', 'string'],
            'filter.type' => ['nullable', 'string'],
            'filter.property_id' => ['nullable', 'uuid'],
            'sort' => ['nullable', 'string'],
        ];
    }
}
