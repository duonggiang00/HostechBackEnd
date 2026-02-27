<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

class MeterReadingUpdateRequest extends FormRequest
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
            'period_start' => ['sometimes', 'date'],
            'period_end' => ['sometimes', 'date', 'after_or_equal:period_start'],
            'reading_value' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', 'in:PENDING,APPROVED,REJECTED'],
            'meta' => ['nullable', 'array']
        ];
    }
}
