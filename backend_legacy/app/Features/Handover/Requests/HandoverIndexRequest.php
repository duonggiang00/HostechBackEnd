<?php

namespace App\Features\Handover\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi trên 1 trang (1-100). Default: 15. Example: 15
 * @queryParam page int Số trang. Example: 1
 * @queryParam search string Tìm kiếm theo ghi chú.
 * @queryParam filter[type] string Lọc theo loại biên bản (CHECKIN, CHECKOUT). Example: CHECKIN
 * @queryParam filter[status] string Lọc theo trạng thái. Example: DRAFT
 * @queryParam filter[property_id] string UUID Lọc theo Property. Example: uuid
 * @queryParam filter[room_id] string UUID Lọc theo Room. Example: uuid
 * @queryParam filter[tenant_user_id] string UUID Lọc theo Tenant. Example: uuid
 * @queryParam sort string Sắp xếp kết quả. Mặc định: -created_at. Example: -created_at
 */
class HandoverIndexRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string'],
            'filter' => ['nullable', 'array'],
        ];
    }
}
