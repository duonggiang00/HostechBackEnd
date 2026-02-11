<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'role' => ['sometimes', 'string', 'in:ADMIN,OWNER,MANAGER,STAFF,TENANT', 'max:20'],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $userId . ',id'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'mfa_enabled' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
