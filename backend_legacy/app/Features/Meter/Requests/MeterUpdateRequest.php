<?php

namespace App\Features\Meter\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MeterUpdateRequest extends FormRequest
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
            'room_id' => ['nullable', 'uuid', 'exists:rooms,id'],
            'property_id' => ['nullable', 'uuid', 'exists:properties,id'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('meters', 'code')
                    ->where(function ($query) {
                        return $query->where('org_id', auth()->user()->org_id);
                    })
                    ->ignore($this->route('meter')),
            ],
            'service_id' => ['sometimes', 'required', 'string', 'exists:services,id'],
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
