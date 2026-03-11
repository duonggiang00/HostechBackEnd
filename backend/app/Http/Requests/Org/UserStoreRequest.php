<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'org_id' => ['required', 'uuid', 'exists:orgs,id'],
            'role' => ['required', 'string', 'in:ADMIN,OWNER,MANAGER,STAFF,TENANT', 'max:20'],
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'mfa_enabled' => ['nullable', 'boolean'],
        ];
    }
}
