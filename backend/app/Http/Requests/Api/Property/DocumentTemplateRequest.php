<?php

namespace App\Http\Requests\Api\Property;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DocumentTemplateRequest extends FormRequest
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
        $rules = [
            'property_id' => 'nullable|uuid|exists:properties,id',
            'type'        => ['required', 'string', Rule::in(['CONTRACT', 'ANNEX', 'HANDOVER', 'INVOICE', 'RECEIPT'])],
            'format'      => ['required', 'string', Rule::in(['HTML', 'DOCX'])],
            'name'        => 'required|string|max:255',
            'is_active'   => 'nullable|boolean',
            'variables'   => 'nullable|array',
        ];

        if ($this->isMethod('POST')) {
            if ($this->input('format') === 'HTML') {
                $rules['content'] = 'required|string';
            } else {
                $rules['file'] = 'required|file|mimes:docx|max:5120'; // 5MB
            }
        } else {
            // Update
            if ($this->input('format') === 'HTML') {
                $rules['content'] = 'nullable|string';
            } else {
                $rules['file'] = 'nullable|file|mimes:docx|max:5120';
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'type.in'      => 'Loại tài liệu không hợp lệ (CONTRACT, ANNEX, HANDOVER, INVOICE, RECEIPT).',
            'format.in'    => 'Định dạng tài liệu phải là HTML hoặc DOCX.',
            'file.required' => 'Vui lòng upload file .docx làm mẫu tài liệu.',
            'file.mimes'    => 'Mẫu tài liệu Word phải là định dạng .docx',
            'content.required' => 'Vui lòng nhập nội dung HTML cho mẫu tài liệu.',
        ];
    }
}
