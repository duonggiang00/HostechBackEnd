<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class RoomTemplateUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'room_type' => ['nullable', 'string', 'in:studio,apartment,house,dormitory,other'],
            'area' => ['nullable', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'base_price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable', 'array'],
            'utilities' => ['nullable', 'array'],
            'services' => ['nullable', 'array'],
            'services.*' => ['uuid', 'exists:services,id'],
            'assets' => ['nullable', 'array'],
            'assets.*' => ['string', 'max:255'],
            'meters' => ['nullable', 'array'],
            'meters.*' => ['string', 'in:ELECTRIC,WATER'],
        ];
    }
}
