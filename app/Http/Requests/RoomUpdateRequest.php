<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomUpdateRequest extends FormRequest
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
            'type' => ['nullable', 'string', 'in:studio,apartment,house,dormitory,other', 'max:20'],
            'area' => ['nullable', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'base_price' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:available,occupied,maintenance,reserved', 'max:20'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable', 'json'],
            'utilities' => ['nullable', 'json'],
        ];
    }
}
