<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

class MeterReadingBulkStoreRequest extends FormRequest
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
            'readings' => ['required', 'array', 'min:1'],
            'readings.*.meter_id' => ['required', 'string', 'exists:meters,id'],
            'readings.*.period_start' => ['required', 'date_format:Y-m-d'],
            'readings.*.period_end' => ['required', 'date_format:Y-m-d', 'after_or_equal:readings.*.period_start'],
            'readings.*.reading_value' => ['required', 'integer', 'min:0'],
            'readings.*.meta' => ['nullable', 'array'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'readings.required' => 'Dữ liệu chốt số là bắt buộc',
            'readings.array' => 'Dữ liệu chốt số phải là một mảng',
            'readings.*.meter_id.required' => 'Đồng hồ là bắt buộc',
            'readings.*.reading_value.required' => 'Chỉ số là bắt buộc',
            'readings.*.period_start.required' => 'Từ ngày là bắt buộc',
            'readings.*.period_end.required' => 'Đến ngày là bắt buộc',
        ];
    }
}
