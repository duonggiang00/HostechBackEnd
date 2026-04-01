<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

class MeterReadingRejectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'rejection_reason.required' => 'Lý do từ chối là bắt buộc',
            'rejection_reason.min' => 'Lý do từ chối tối thiểu 5 ký tự',
            'rejection_reason.max' => 'Lý do từ chối tối đa 500 ký tự',
        ];
    }
}
