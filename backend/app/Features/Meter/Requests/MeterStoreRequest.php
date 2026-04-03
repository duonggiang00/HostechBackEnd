<?php

namespace App\Features\Meter\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MeterStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'org_id' => ['nullable', 'uuid', 'exists:orgs,id'],
            'property_id' => ['nullable', 'uuid', 'exists:properties,id'],
            'room_id' => ['nullable', 'uuid', 'exists:rooms,id'],
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('meters', 'code')->where(function ($query) {
                    return $query->where('org_id', auth()->user()->org_id);
                }),
            ],
            'service_id' => ['required', 'string', 'exists:services,id'],
            'installed_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'is_master' => ['boolean'],
            'base_reading' => ['nullable', 'numeric', 'min:0'],
            'meta' => ['nullable', 'array'],
            'media_ids' => ['nullable', 'array'],
            'media_ids.*' => ['uuid', 'exists:temporary_uploads,id'],
        ];
    }
}
