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
            'room_id' => ['required', 'uuid', 'exists:rooms,id'],
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
            'meta' => ['nullable', 'array'],
        ];
    }
}
