<?php

namespace App\Http\Requests\System;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam file file required File cần upload (Tối đa 5MB).
 * @bodyParam collection string Tên collection để phân loại file. Example: avatars
 */
class UploadRequest extends FormRequest
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
            'file' => [
                'required',
                'file',
                'max:5120', // Tối đa 5MB
                'mimes:jpeg,png,jpg,gif,svg,pdf,doc,docx,xls,xlsx'
            ],
            'collection' => ['nullable', 'string', 'max:50']
        ];
    }
}
