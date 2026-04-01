<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

class MeterReadingUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period_start' => ['sometimes', 'date_format:Y-m-d'],
            'period_end' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'reading_value' => ['sometimes', 'integer', 'min:0'],
            // Status changes go through dedicated endpoints (submit/approve/reject)
            'proof_media_ids' => ['nullable', 'array'],
            'proof_media_ids.*' => ['uuid'],
            'meta' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'period_start.date_format' => 'Từ ngày phải có định dạng YYYY-MM-DD',
            'period_end.date_format' => 'Đến ngày phải có định dạng YYYY-MM-DD',
            'period_end.after_or_equal' => 'Đến ngày phải >= từ ngày',
            'reading_value.integer' => 'Chỉ số phải là số nguyên',
            'reading_value.min' => 'Chỉ số không được âm',
        ];
    }
}

