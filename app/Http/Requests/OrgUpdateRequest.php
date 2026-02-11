<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrgUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'currency' => ['nullable', 'string', 'max:8'],
        ];
    }
}
