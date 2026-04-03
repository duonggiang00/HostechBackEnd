<?php

namespace App\Features\Property\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomCreateFromTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_id' => ['required', 'uuid', 'exists:room_templates,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50'],
            'floor_id' => ['nullable', 'uuid', 'exists:floors,id'],
            'floor_number' => ['nullable', 'integer'],
        ];
    }
}
