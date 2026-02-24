<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class PropertyStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:properties,code'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'use_floors' => ['nullable', 'boolean'],
            'default_billing_cycle' => ['nullable', 'string', 'max:20'],
            'default_due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'default_cutoff_day' => ['nullable', 'integer', 'min:1', 'max:31'],
        ];
    }
}
