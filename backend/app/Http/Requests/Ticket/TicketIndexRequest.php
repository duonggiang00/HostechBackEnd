<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng mục mỗi trang. Default: 15. Example: 10
 * @queryParam page int Số trang. Example: 1
 * @queryParam search string Tìm kiếm theo mô tả hoặc loại sự cố. Example: điện
 * @queryParam sort string Sắp xếp theo trường (prefix `-` để giảm dần). Các trường hỗ trợ: `created_at`, `updated_at`, `due_at`, `priority`, `status`. Default: -created_at. Example: -created_at
 * @queryParam filter[status] string Lọc theo trạng thái. Enum: `OPEN`, `RECEIVED`, `IN_PROGRESS`, `WAITING_PARTS`, `DONE`, `CANCELLED`. Example: OPEN
 * @queryParam filter[priority] string Lọc theo độ ưu tiên. Enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`. Example: HIGH
 * @queryParam filter[property_id] string UUID Lọc theo Tòa nhà. Example: uuid
 * @queryParam filter[room_id] string UUID Lọc theo Phòng. Example: uuid
 * @queryParam filter[assigned_to_user_id] string UUID Nhân viên được giao xử lý. Example: uuid
 * @queryParam filter[contract_id] string UUID Hợp đồng liên quan. Example: uuid
 */
class TicketIndexRequest extends FormRequest
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
