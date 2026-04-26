<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'phone' => ['nullable', 'string', 'max:30', Rule::unique('users', 'phone')->where('org_id', $this->org_id)],
            'identity_number' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'mfa_enabled' => ['nullable', 'boolean'],
            'properties_scope' => ['nullable', 'array'],
            'properties_scope.*' => ['uuid', 'exists:properties,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.unique' => 'Số điện thoại này đã được sử dụng trong hệ thống.',
            'email.unique' => 'Địa chỉ email này đã được sử dụng trong hệ thống.',
        ];
    }
}
