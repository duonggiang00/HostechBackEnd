<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Org\User;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');
        $user = User::find($userId);
        $orgId = $user ? $user->org_id : null;

        return [
            'role' => ['sometimes', 'string', 'in:ADMIN,OWNER,MANAGER,STAFF,TENANT', 'max:20'],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30', Rule::unique('users', 'phone')->where('org_id', $orgId)->ignore($userId)],
            'identity_number' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$userId.',id'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'mfa_enabled' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
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
