<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

class MeterReadingStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Get meter_id from the URL route parameter and merge into request data
        // Laravel nested resource route uses 'meter' as the parameter name
        $meter = $this->route('meter');
        if ($meter) {
            // Handle both Model object and string ID
            $meter_id = is_object($meter) ? $meter->id : $meter;
            $this->merge([
                'meter_id' => $meter_id,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $meterId = $this->route('meter');
        // Handle both Model object and string ID
        $meter_id = is_object($meterId) ? $meterId->id : $meterId;
        
        return [
            'meter_id' => ['required', 'string', 'exists:meters,id'],
            'period_start' => [
                'required', 
                'date_format:Y-m-d',
                function ($attribute, $value, $fail) use ($meter_id) {
                    // Check if a non-deleted reading exists with same meter_id and period range
                    $exists = \App\Models\Meter\MeterReading::where('meter_id', $meter_id)
                        ->where('period_start', $value)
                        ->where('period_end', $this->input('period_end'))
                        ->whereNull('deleted_at')
                        ->exists();
                    
                    if ($exists) {
                        $fail('Đã tồn tại chốt số cho khoảng thời gian này');
                    }
                },
            ],
            'period_end' => ['required', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'reading_value' => ['required', 'integer', 'min:0'],
            'proof_media_ids' => ['nullable', 'array'],
            'proof_media_ids.*' => ['uuid'],
            'meta' => ['nullable', 'array'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'meter_id.required' => 'Đồng hồ là bắt buộc',
            'meter_id.string' => 'Đồng hồ phải là chuỗi',
            'meter_id.exists' => 'Đồng hồ không tồn tại',
            'period_start.required' => 'Từ ngày là bắt buộc',
            'period_start.date_format' => 'Từ ngày phải có định dạng YYYY-MM-DD',
            'period_end.required' => 'Đến ngày là bắt buộc',
            'period_end.date_format' => 'Đến ngày phải có định dạng YYYY-MM-DD',
            'period_end.after_or_equal' => 'Đến ngày phải >= từ ngày',
            'reading_value.required' => 'Chỉ số là bắt buộc',
            'reading_value.integer' => 'Chỉ số phải là số nguyên',
            'reading_value.min' => 'Chỉ số không được âm',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        \Log::error('MeterReadingStoreRequest validation failed', [
            'errors' => $validator->errors()->toArray(),
            'request_data' => $this->all(),
            'route_params' => $this->route()->parameters(),
        ]);
        
        parent::failedValidation($validator);
    }
}
