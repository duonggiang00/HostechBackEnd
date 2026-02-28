<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class ContractMemberUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'identity_number' => ['nullable', 'string', 'max:50'],
            'role' => ['nullable', 'string', 'in:TENANT,ROOMMATE,GUARANTOR'],
            'is_primary' => ['boolean'],
            'joined_at' => ['nullable', 'date'],
            'left_at' => ['nullable', 'date'],
        ];
    }

    public function attributes()
    {
        return [
            'user_id' => 'Tài khoản hệ thống',
            'full_name' => 'Họ và tên',
            'phone' => 'Số điện thoại',
            'identity_number' => 'CMND/CCCD',
            'role' => 'Vai trò',
            'is_primary' => 'Đại diện chính',
        ];
    }
}
