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
            'period_start' => ['sometimes', 'date_format:Y-m-d'],
            'period_end' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'reading_value' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', 'in:PENDING,APPROVED,REJECTED'],
            'meta' => ['nullable', 'array'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'period_start.date_format' => 'Từ ngày phải có định dạng YYYY-MM-DD',
            'period_end.date_format' => 'Đến ngày phải có định dạng YYYY-MM-DD',
            'period_end.after_or_equal' => 'Đến ngày phải >= từ ngày',
            'reading_value.integer' => 'Chỉ số phải là số nguyên',
            'reading_value.min' => 'Chỉ số không được âm',
            'status.in' => 'Trạng thái phải là PENDING, APPROVED hoặc REJECTED',
        ];
    }
}
