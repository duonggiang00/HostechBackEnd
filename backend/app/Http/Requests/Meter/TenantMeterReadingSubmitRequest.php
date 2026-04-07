<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

class TenantMeterReadingSubmitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('Tenant');
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:ELECTRIC,WATER'],
            'reading_value' => ['required', 'integer', 'min:0'],
            'photo_url' => ['nullable', 'string'],
            'photo_id' => ['nullable', 'string', 'exists:temporary_uploads,id'],
        ];
    }
}
