<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi trên một trang. Mặc định 15. Example: 10
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam search string Từ khóa tìm kiếm (tên, email). Example: John Doe
 */
class UserIndexRequest extends FormRequest
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
            'filter.role' => ['nullable', 'string', 'in:ADMIN,MANAGER,STAFF,TENANT'],
            'filter.email' => ['nullable', 'string'],
            'filter.is_active' => ['nullable', 'boolean'],
            'sort' => ['nullable', 'string', 'in:full_name,email,created_at,-full_name,-email,-created_at'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'with_trashed' => 'Bao gồm bản ghi đã xóa',
            'filter.role' => 'Quyền hạn',
            'filter.email' => 'Email',
            'filter.is_active' => 'Trạng thái hoạt động',
            'sort' => 'Sắp xếp',
        ];
    }
}
