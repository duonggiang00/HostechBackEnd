<?php

namespace App\Http\Requests\Handover;

use Illuminate\Foundation\Http\FormRequest;

class HandoverStoreRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'contract_id' => ['required', 'uuid', 'exists:contracts,id'],
            'room_id' => ['required', 'uuid', 'exists:rooms,id'],
            'type' => ['required', 'string', 'in:CHECKIN,CHECKOUT'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
