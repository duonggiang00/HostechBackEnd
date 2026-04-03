<?php

namespace App\Features\Meter\Requests;

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
        $meter = $this->route('meter');
        if ($meter) {
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
        return [
            'meter_id' => ['required', 'string', 'exists:meters,id'],
            'period_start' => ['required', 'date_format:Y-m-d'],
            'period_end' => ['required', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'reading_value' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:DRAFT,SUBMITTED,APPROVED,REJECTED'],
            'meta' => ['nullable', 'array'],
            'proof_media_ids' => ['nullable', 'array'],
            'proof_media_ids.*' => ['string', 'exists:temporary_uploads,id'],
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
            'reading_value.numeric' => 'Chỉ số phải là số',
            'reading_value.min' => 'Chỉ số không được âm',
            'status.in' => 'Trạng thái phải là DRAFT, SUBMITTED, APPROVED hoặc REJECTED',
        ];
    }
}
