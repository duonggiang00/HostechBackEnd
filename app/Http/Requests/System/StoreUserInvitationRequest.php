<?php

namespace App\Http\Requests\System;

use Illuminate\Foundation\Http\FormRequest;

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
            'properties_scope.*' => ['uuid', 'exists:properties,id']
        ];
    }
}
