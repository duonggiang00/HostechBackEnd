<?php

namespace App\Features\System\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam email string required Email người được mời. Phải là duy nhất. Example: user@example.com
 * @bodyParam role_name string required Vai trò gán cho người dùng (Owner, Manager, Staff, Tenant). Example: Manager
 * @bodyParam org_id string ID tổ chức (bắt buộc nếu Admin mời Manager/Staff/Tenant).
 * @bodyParam properties_scope array Danh sách ID các tòa nhà được phép quản lý (dành cho Manager).
 */
class StoreUserInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255', 'unique:users,email', 'unique:user_invitations,email,NULL,id,registered_at,NULL'],
            'role_name' => ['required', 'string', 'in:Owner,Manager,Staff,Tenant'],
            'org_id' => ['nullable', 'uuid', 'exists:orgs,id'],
            'properties_scope' => ['nullable', 'array'],
            'properties_scope.*' => ['uuid', 'exists:properties,id'],
        ];
    }
}
