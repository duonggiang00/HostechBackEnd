<?php

namespace App\Features\Property\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomTemplateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', 'exists:properties,id'],
            'name' => ['required', 'string', 'max:255'],
            'room_type' => ['required', 'string', 'in:studio,apartment,house,dormitory,other'],
            'area' => ['required', 'numeric', 'min:0'],
            'capacity' => ['required', 'integer', 'min:1'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable', 'array'],
            'utilities' => ['nullable', 'array'],
            'services' => ['nullable', 'array'],
            'services.*' => ['uuid', 'exists:services,id'],
            'assets' => ['nullable', 'array'],
            'assets.*' => ['string', 'max:255'],
            'meters' => ['nullable', 'array'],
            'meters.*.type' => ['required', 'string', 'in:ELECTRIC,WATER'],
            'meters.*.service_id' => [
                'required',
                'uuid',
                'exists:services,id',
            ],
        ];
    }
}
