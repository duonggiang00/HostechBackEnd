<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class ServiceIndexRequest extends FormRequest
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
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'string', 'max:255'],
            'filter' => ['nullable', 'array'],
            'filter.is_active' => ['nullable', 'boolean'],
            'filter.unit' => ['nullable', 'string', 'max:50'],
            'sort' => ['nullable', 'string', 'in:code,name,created_at,-code,-name,-created_at'],
            'with_trashed' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'filter.is_active' => 'Trạng thái hoạt động',
            'filter.unit' => 'Đơn vị tính',
            'sort' => 'Sắp xếp',
        ];
    }
}
