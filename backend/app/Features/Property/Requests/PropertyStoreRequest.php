<?php

namespace App\Features\Property\Requests;

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
            'org_id' => ['nullable', 'uuid', 'exists:orgs,id'],
            'code' => ['required', 'string', 'max:50', 'unique:properties,code'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'area' => ['nullable', 'numeric', 'min:0'],
            'shared_area' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string'],
            'use_floors' => ['nullable', 'boolean'],
            'default_billing_cycle' => ['nullable', 'string', 'max:20'],
            'default_due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'default_cutoff_day' => ['nullable', 'integer', 'min:1', 'max:25'],
            'default_rent_price_per_m2' => ['nullable', 'numeric', 'min:0'],
            'default_deposit_months' => ['nullable', 'integer', 'min:0'],
            'default_services' => ['nullable', 'array'],
            'default_services.*' => ['uuid', 'exists:services,id'],
        ];
    }
}
