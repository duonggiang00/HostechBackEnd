<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

class MeterReadingFinalizeApprovedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period_start' => ['required', 'date_format:Y-m-d'],
            'period_end' => ['required', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'readings' => ['required', 'array', 'min:1'],
            'readings.*.meter_id' => ['required', 'string', 'exists:meters,id'],
            'readings.*.reading_value' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'period_start.required' => 'Kỳ từ ngày là bắt buộc.',
            'period_end.required' => 'Kỳ đến ngày là bắt buộc.',
            'readings.required' => 'Cần ít nhất một chỉ số đồng hồ.',
            'readings.min' => 'Cần ít nhất một chỉ số đồng hồ.',
        ];
    }
}
