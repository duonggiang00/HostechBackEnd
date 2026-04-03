<?php

namespace App\Features\Meter\Requests;

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
            'reading_value' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', 'string', 'in:DRAFT,SUBMITTED,APPROVED,REJECTED,LOCKED'],
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
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
            'period_start.date_format' => 'Từ ngày phải có định dạng YYYY-MM-DD',
            'period_end.date_format' => 'Đến ngày phải có định dạng YYYY-MM-DD',
            'period_end.after_or_equal' => 'Đến ngày phải >= từ ngày',
            'reading_value.numeric' => 'Chỉ số phải là số',
            'reading_value.min' => 'Chỉ số không được âm',
            'status.in' => 'Trạng thái không hợp lệ',
        ];
    }
}
