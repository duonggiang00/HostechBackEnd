<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi trên một trang. Mặc định 15. Example: 10
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam search string Từ khóa tìm kiếm (tên, email, phone). Example: Công ty A
 * @queryParam filter[name] string Lọc theo tên tổ chức.
 * @queryParam filter[email] string Lọc theo email.
 * @queryParam filter[phone] string Lọc theo số điện thoại.
 * @queryParam with_trashed boolean Bao gồm các bản ghi đã xóa. Example: true
 */
class OrgIndexRequest extends FormRequest
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
            'search' => ['nullable', 'string'],
            'with_trashed' => ['nullable', 'boolean'],
            'filter.name' => ['nullable', 'string'],
            'filter.email' => ['nullable', 'string'],
            'filter.phone' => ['nullable', 'string'],
            'sort' => ['nullable', 'string', 'in:name,email,created_at,-name,-email,-created_at'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'with_trashed' => 'Bao gồm bản ghi đã xóa',
            'filter.name' => 'Tên tổ chức',
            'filter.email' => 'Email',
            'filter.phone' => 'Số điện thoại',
            'sort' => 'Sắp xếp',
        ];
    }
}
