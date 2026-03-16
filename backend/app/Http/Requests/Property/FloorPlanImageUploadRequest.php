<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class FloorPlanImageUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'], // Max 5MB
        ];
    }
}
