<?php

namespace App\Http\Requests\System;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam file file required File cần upload (Tối đa 5MB).
 * @bodyParam collection string Tên collection để phân loại file. Example: avatars, contract-members
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:5120', // Tối đa 5MB
                // webp: Chrome/Android; heic/heif: ảnh iPhone; bmp: một số máy ảnh cũ
                'mimes:jpeg,png,jpg,gif,svg,webp,bmp,heic,heif,pdf,doc,docx,xls,xlsx',
            ],
            'collection' => ['nullable', 'string', 'max:50'],
        ];
    }
}
