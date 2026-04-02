<?php

namespace App\Features\System\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Yêu cầu danh sách nhật ký hệ thống.
 *
 * @queryParam per_page integer Số lượng bản ghi trên một trang. Example: 20
 * @queryParam page integer Trang hiện tại. Example: 1
 * @queryParam filter[log_name] string Lọc theo tên log (default, auth...).
 * @queryParam filter[event] string Lọc theo sự kiện (created, updated, deleted...).
 * @queryParam filter[subject_type] string Lọc theo loại đối tượng (Room, User...).
 * @queryParam filter[subject_id] string Lọc theo ID đối tượng (UUID).
 * @queryParam filter[causer_id] string Lọc theo ID người thực hiện (UUID).
 * @queryParam sort string Sắp xếp theo trường (ví dụ: -created_at).
 */
class AuditLogIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'filter.log_name' => ['nullable', 'string'],
            'filter.event' => ['nullable', 'string'],
            'filter.subject_type' => ['nullable', 'string'],
            'filter.subject_id' => ['nullable', 'uuid'],
            'filter.causer_id' => ['nullable', 'uuid'],
            'sort' => ['nullable', 'string'],
        ];
    }
}
