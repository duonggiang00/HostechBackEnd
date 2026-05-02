<?php

namespace App\Http\Requests\Org;

use App\Support\OrgUserPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
            'identity_number' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'mfa_enabled' => ['nullable', 'boolean'],
            'properties_scope' => ['nullable', 'array'],
            'properties_scope.*' => ['uuid', 'exists:properties,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $d = $v->getData();
            $orgId = $d['org_id'] ?? null;
            $phone = isset($d['phone']) ? (string) $d['phone'] : '';
            $email = isset($d['email']) ? (string) $d['email'] : null;
            if (! $orgId || trim($phone) === '') {
                return;
            }
            $conflict = OrgUserPhone::findConflictingUserInOrg((string) $orgId, $phone, $email);
            if ($conflict) {
                $v->errors()->add(
                    'phone',
                    sprintf(
                        'Số điện thoại đã gắn với tài khoản %s (%s). Vui lòng dùng email khác hoặc cập nhật SĐT tài khoản hiện có.',
                        $conflict->full_name ?: '—',
                        $conflict->email
                    )
                );
            }
        });
    }
}
