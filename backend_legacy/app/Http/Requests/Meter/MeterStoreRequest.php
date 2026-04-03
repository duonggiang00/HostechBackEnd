<?php

namespace App\Http\Requests\Meter;

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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'org_id' => ['nullable', 'uuid', 'exists:orgs,id'],
            'room_id' => ['nullable', 'uuid', 'exists:rooms,id'],
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('meters', 'code')->where(function ($query) {
                    return $query->where('org_id', auth()->user()->org_id);
                }),
            ],
            'type' => ['required', 'string', Rule::in(['ELECTRIC', 'WATER'])],
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
