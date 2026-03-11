<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class RoomAssetStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // We use Policy for auth
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'serial' => ['nullable', 'string', 'max:100'],
            'condition' => ['nullable', 'string', 'max:50'],
            'purchased_at' => ['nullable', 'date'],
            'warranty_end' => ['nullable', 'date', 'after_or_equal:purchased_at'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
